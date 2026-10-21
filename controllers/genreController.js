const Genre = require("../models/genre");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// 种类列表 GET
exports.genre_list = asyncHandler(async (req, res, next) => {
// 查询所有分类，按name升序
  const list_genres = await Genre.find().sort({ name: 1 });
  // 渲染模板，传递变量
  res.render('genre_list', {
    title: 'Genre List',
    genre_list: list_genres
  });

});

// 种类详情 GET
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id);
  const genre_books = await Book.find({ genre: req.params.id }, 'title summary');
  if (genre == null) {
    // No results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  // Successful, so render
  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: genre_books,
  });
});

// 种类 创建 GET
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render('genre_form', { title: 'Create Genre' });
});

// 种类 创建 POST
exports.genre_create_post = [
  // 校验name字段
  body('name', 'Genre name required').trim().isLength({ min: 3 }).escape(),

  asyncHandler(async (req, res, next) => {
    // 提取校验结果
    const errors = validationResult(req);

    // 创建genre对象
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // 校验出错，重新渲染表单，带回错误信息
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array()
      });
      return;
    } else {
      // 校验通过，判断同名分类是否存在
      const genreExists = await Genre.findOne({ name: req.body.name });
      if (genreExists) {
        // 已存在，重定向到该分类详情页
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        // 保存成功，跳转到详情页
        res.redirect(genre.url);
      }
    }
  })
];

