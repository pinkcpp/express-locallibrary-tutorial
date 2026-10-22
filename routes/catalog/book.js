/**
 * 图书（Book）子路由。
 * 挂载于 /catalog，路径保持与原实现一致（列表用复数 /books，其余用单数 /book）。
 */
const express = require('express');
const bookController = require('../../controllers/bookController');

const router = express.Router();

// 图书列表
router.get('/books', bookController.book_list);

// 创建图书
router.get('/book/create', bookController.book_create_get);
router.post('/book/create', bookController.book_create_post);

// 图书详情与增删改
router.get('/book/:id', bookController.book_detail);
router.get('/book/:id/delete', bookController.book_delete_get);
router.post('/book/:id/delete', bookController.book_delete_post);
router.get('/book/:id/update', bookController.book_update_get);
router.post('/book/:id/update', bookController.book_update_post);

module.exports = router;
