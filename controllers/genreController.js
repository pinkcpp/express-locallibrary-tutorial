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


/**
 * GET /catalog/genre/:id/delete：删除确认页，存在关联图书时禁止删除。
 * @type {import('express').RequestHandler}
 */
exports.genre_delete_get = async (req, res) => {
  const [genre, genreBooks] = await Promise.all([
    Genre.findById(req.params.id),
    Book.find({ genre: req.params.id }, 'title summary'),
  ]);

  if (genre === null) {
    res.redirect('/catalog/genres');
    return;
  }

  res.render('genre_delete', {
    title: 'Delete Genre',
    genre: genre,
    genre_books: genreBooks,
  });
};

/**
 * POST /catalog/genre/:id/delete：仅删除没有关联图书的种类。
 * @type {import('express').RequestHandler}
 */
exports.genre_delete_post = async (req, res) => {
  const [genre, genreBooks] = await Promise.all([
    Genre.findById(req.params.id),
    Book.find({ genre: req.params.id }, 'title summary'),
  ]);

  if (genre === null) {
    res.redirect('/catalog/genres');
    return;
  }

  if (genreBooks.length > 0) {
    // 还有图书属于该种类，禁止删除
    res.render('genre_delete', {
      title: 'Delete Genre',
      genre: genre,
      genre_books: genreBooks,
    });
    return;
  }

  await Genre.findByIdAndDelete(req.params.id);
  res.redirect('/catalog/genres');
};

/**
 * GET /catalog/genre/:id/update：渲染更新种类表单。
 * @type {import('express').RequestHandler}
 */
exports.genre_update_get = async (req, res) => {
  const genre = await Genre.findById(req.params.id);

  if (genre === null) {
    throw createError(404, 'Genre not found');
  }

  res.render('genre_form', {
    title: 'Update Genre',
    genre: genre,
  });
};

/**
 * POST /catalog/genre/:id/update：校验并更新种类，失败时回显表单。
 * @type {import('express').RequestHandler[]}
 */
exports.genre_update_post = [
  body('name', 'Genre name required').trim().isLength({ min: 3 }).escape(),

  async (req, res) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render('genre_form', {
        title: 'Update Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    }

    const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
    res.redirect(updatedGenre.url);
  },
];


