/**
 * 示例用户路由。
 */
const express = require('express');

const router = express.Router();

// GET 用户列表（示例）
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

// GET 示例页面
router.get('/cool', (req, res) => {
  res.send('你好酷');
});

module.exports = router;
