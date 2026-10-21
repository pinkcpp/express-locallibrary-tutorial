require('dotenv').config();
// 本机默认 DNS 拒绝 Node 的 SRV 查询，须指定公共 DNS 才能解析 Atlas 的 mongodb+srv 地址
const dns = require('dns');
dns.setServers(['223.5.5.5', '8.8.8.8']);
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const catalogRouter = require("./routes/catalog"); // 导入 catalog 路由

var app = express();

const mongoose = require('mongoose');
// dev 连本地库，test / production 连 Atlas
const isProduction = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'production';
const mongoURI = isProduction ? process.env.ATLAS_MONGODB_URI : process.env.LOCAL_MONGODB_URI;
mongoose.connect(mongoURI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));
db.once('open', () => {
  console.log(`✅ MongoDB 数据库连接成功！（${isProduction ? 'Atlas' : '本地'}）`);
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/catalog", catalogRouter); // 将 catalog 路由添加进中间件链

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
