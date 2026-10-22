const createError = require('http-errors');
const { body, validationResult } = require('express-validator');

const Genre = require('../models/genre');
const Book = require('../models/book');

/**
 * GET /catalog/genres：呈现所有图书种类。
 * @type {import('express').RequestHandler}
 */
exports.genre_list = async (req, res) => {
  // 查询所有分类，按 name 升序
  const list_genres = await Genre.find().sort({ name: 1 });

  res.render('genre_list', {
    title: 'Genre List',
    genre_list: list_genres,
  });
};

/**
 * GET /catalog/genre/:id：呈现指定种类的详情及其图书。
 * @type {import('express').RequestHandler}
 */
exports.genre_detail = async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  const genre_books = await Book.find({ genre: req.params.id }, 'title summary');

  if (genre === null) {
    throw createError(404, 'Genre not found');
  }

  res.render('genre_detail', {
    title: 'Genre Detail',
    genre: genre,
    genre_books: genre_books,
  });
};

/**
 * GET /catalog/genre/create：渲染创建种类表单。
 * @type {import('express').RequestHandler}
 */
exports.genre_create_get = async (req, res) => {
  res.render('genre_form', { title: 'Create Genre' });
};

/**
 * POST /catalog/genre/create：校验并保存新种类，重名时跳转到已有种类。
 * @type {import('express').RequestHandler[]}
 */
exports.genre_create_post = [
  body('name', 'Genre name required').trim().isLength({ min: 3 }).escape(),

  async (req, res) => {
    const errors = validationResult(req);

    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // 校验出错，重新渲染表单，带回错误信息
      res.render('genre_form', {
        title: 'Create Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    }

    // 校验通过，判断同名分类是否存在
    const genreExists = await Genre.findOne({ name: req.body.name });
    if (genreExists) {
      // 已存在，重定向到该分类详情页
      res.redirect(genreExists.url);
      return;
    }

    await genre.save();
    res.redirect(genre.url);
  },
];
