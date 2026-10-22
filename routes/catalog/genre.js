/**
 * 图书种类（Genre）子路由。
 * 挂载于 /catalog，路径保持与原实现一致（仅提供列表、创建与详情）。
 */
const express = require('express');
const genreController = require('../../controllers/genreController');

const router = express.Router();

// 种类列表
router.get('/genres', genreController.genre_list);

// 创建种类
router.get('/genre/create', genreController.genre_create_get);
router.post('/genre/create', genreController.genre_create_post);

// 种类详情
router.get('/genre/:id', genreController.genre_detail);

// 删除种类
router.get('/genre/:id/delete', genreController.genre_delete_get);
router.post('/genre/:id/delete', genreController.genre_delete_post);

// 更新种类
router.get('/genre/:id/update', genreController.genre_update_get);
router.post('/genre/:id/update', genreController.genre_update_post);

module.exports = router;
