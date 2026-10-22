var express = require('express');
var router = express.Router();

// GET 首页：重定向到编目页
router.get('/', (req, res) => {
  res.redirect('/catalog');
});

module.exports = router;
