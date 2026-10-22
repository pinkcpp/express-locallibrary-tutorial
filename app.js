require('dotenv').config();

// 本机默认 DNS 拒绝 Node 的 SRV 查询，须指定公共 DNS 才能解析 Atlas 的 mongodb+srv 地址
const dns = require('dns');
dns.setServers(['223.5.5.5', '8.8.8.8']);

const path = require('path');
const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const logger = require('morgan');
const mongoose = require('mongoose');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog');

const app = express();

// dev 连本地库，test / production 连 Atlas
const isProduction = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production';
const mongoURI = isProduction ? process.env.ATLAS_MONGODB_URI : process.env.LOCAL_MONGODB_URI;
mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));
db.once('open', () => {
  console.log(`✅ MongoDB 数据库连接成功！（${isProduction ? 'Atlas' : '本地'}）`);
});

// 视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// 中间件按 Express 5 规范顺序加载：安全 → 日志 → 请求体解析 → Cookie → 静态资源 → 路由 → 404 → 错误处理
// 布局模板引用了 Bootstrap / jQuery 的公共 CDN，CSP 需放行这些来源，否则样式与脚本会被浏览器拦截
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://maxcdn.bootstrapcdn.com'],
        'script-src': ["'self'", 'https://maxcdn.bootstrapcdn.com', 'https://ajax.googleapis.com'],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'", 'https://maxcdn.bootstrapcdn.com'],
      },
    },
  })
);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// 未匹配任何路由时生成 404，交给统一错误处理
app.use((req, res, next) => {
  next(createError(404));
});

/**
 * 统一错误处理中间件。
 *
 * Express 5 会自动捕获 async 路由处理器中被拒绝（reject）的 Promise，
 * 并转发到这里，因此不需要 express-async-handler 之类的包装器。
 *
 * @param {Error & { status?: number }} err 错误对象
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
app.use((err, req, res, next) => {
  // 响应已开始发送时无法再渲染错误页，交回 Express 默认处理
  if (res.headersSent) {
    return next(err);
  }

  // 仅在开发环境暴露错误详情
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
