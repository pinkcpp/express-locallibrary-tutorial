/**
 * 目录（Catalog）主路由，挂载于 /catalog。
 * 按资源拆分为 book / author / genre / bookinstance 四个子路由。
 */
const express = require('express');
const bookController = require('../../controllers/bookController');

const bookRouter = require('./book');
const authorRouter = require('./author');
const genreRouter = require('./genre');
const bookinstanceRouter = require('./bookinstance');

const router = express.Router();

// GET 编目首页
router.get('/', bookController.index);

// 各资源子路由（路径均在子路由中显式声明，互不重叠）
router.use(bookRouter);
router.use(authorRouter);
router.use(genreRouter);
router.use(bookinstanceRouter);

module.exports = router;
