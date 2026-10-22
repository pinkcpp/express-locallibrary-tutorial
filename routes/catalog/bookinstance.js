/**
 * 藏书副本（BookInstance）子路由。
 * 挂载于 /catalog，路径保持与原实现一致。
 */
const express = require('express');
const bookinstanceController = require('../../controllers/bookinstanceController');

const router = express.Router();

// 副本列表
router.get('/bookinstances', bookinstanceController.bookinstance_list);

// 创建副本
router.get('/bookinstance/create', bookinstanceController.bookinstance_create_get);
router.post('/bookinstance/create', bookinstanceController.bookinstance_create_post);

// 副本详情
router.get('/bookinstance/:id', bookinstanceController.bookinstance_detail);

// 删除副本
router.get('/bookinstance/:id/delete', bookinstanceController.bookinstance_delete_get);
router.post('/bookinstance/:id/delete', bookinstanceController.bookinstance_delete_post);

// 更新副本
router.get('/bookinstance/:id/update', bookinstanceController.bookinstance_update_get);
router.post('/bookinstance/:id/update', bookinstanceController.bookinstance_update_post);

module.exports = router;
