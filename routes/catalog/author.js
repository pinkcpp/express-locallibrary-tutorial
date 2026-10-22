/**
 * 作者（Author）子路由。
 * 挂载于 /catalog，路径保持与原实现一致。
 */
const express = require('express');
const authorController = require('../../controllers/authorController');

const router = express.Router();

// 作者列表
router.get('/authors', authorController.author_list);

// 创建作者
router.get('/author/create', authorController.author_create_get);
router.post('/author/create', authorController.author_create_post);

// 作者详情与增删改
router.get('/author/:id', authorController.author_detail);
router.get('/author/:id/delete', authorController.author_delete_get);
router.post('/author/:id/delete', authorController.author_delete_post);
router.get('/author/:id/update', authorController.author_update_get);
router.post('/author/:id/update', authorController.author_update_post);

module.exports = router;
