const createError = require('http-errors');
const { body, validationResult } = require('express-validator');

const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');

/**
 * GET /catalog/bookinstances：呈现所有藏书副本的列表。
 * @type {import('express').RequestHandler}
 */
exports.bookinstance_list = async (req, res) => {
  const allBookInstances = await BookInstance.find().populate('book');

  res.render('bookinstance_list', {
    title: 'Book Instance List',
    bookinstance_list: allBookInstances,
  });
};

/**
 * GET /catalog/bookinstance/:id：呈现藏书副本的详情。
 * @type {import('express').RequestHandler}
 */
exports.bookinstance_detail = async (req, res) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book');

  if (bookInstance === null) {
    throw createError(404, 'Book copy not found');
  }

  res.render('bookinstance_detail', {
    title: 'Copy: ' + bookInstance.book.title,
    bookinstance: bookInstance,
  });
};

/**
 * GET /catalog/bookinstance/create：渲染创建副本表单。
 * @type {import('express').RequestHandler}
 */
exports.bookinstance_create_get = async (req, res) => {
  const allBooks = await Book.find({}, 'title');

  res.render('bookinstance_form', {
    title: 'Create BookInstance',
    book_list: allBooks,
  });
};

/**
 * POST /catalog/bookinstance/create：校验并保存新副本，失败时回显表单。
 * @type {import('express').RequestHandler[]}
 */
exports.bookinstance_create_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('status').trim().notEmpty(),
  body('due_back', 'Invalid date').optional({ values: 'falsy' }).isISO8601(),

  async (req, res) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      // 校验失败，重新渲染表单
      const allBooks = await Book.find({}, 'title');
      res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
        selected_book: bookInstance.book ? bookInstance.book._id : '',
        bookinstance: bookInstance,
        errors: errors.array(),
      });
      return;
    }

    await bookInstance.save();
    res.redirect(bookInstance.url);
  },
];

/**
 * GET /catalog/bookinstance/:id/delete：删除确认页。
 * @type {import('express').RequestHandler}
 */
exports.bookinstance_delete_get = async (req, res) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book');

  if (bookInstance === null) {
    res.redirect('/catalog/bookinstances');
    return;
  }

  res.render('bookinstance_delete', {
    title: 'Delete BookInstance',
    bookinstance: bookInstance,
  });
};

/**
 * POST /catalog/bookinstance/:id/delete：删除藏书副本。
 * @type {import('express').RequestHandler}
 */
exports.bookinstance_delete_post = async (req, res) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book');

  if (bookInstance === null) {
    res.redirect('/catalog/bookinstances');
    return;
  }

  await BookInstance.findByIdAndDelete(req.params.id);
  res.redirect('/catalog/bookinstances');
};

/**
 * GET /catalog/bookinstance/:id/update：渲染更新副本表单。
 * @type {import('express').RequestHandler}
 */
exports.bookinstance_update_get = async (req, res) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate('book'),
    Book.find({}, 'title'),
  ]);

  if (bookInstance === null) {
    throw createError(404, 'Book copy not found');
  }

  res.render('bookinstance_form', {
    title: 'Update BookInstance',
    book_list: allBooks,
    selected_book: bookInstance.book._id,
    bookinstance: bookInstance,
  });
};

/**
 * POST /catalog/bookinstance/:id/update：校验并更新副本，失败时回显表单。
 * @type {import('express').RequestHandler[]}
 */
exports.bookinstance_update_post = [
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('status').trim().notEmpty(),
  body('due_back', 'Invalid date').optional({ values: 'falsy' }).isISO8601(),

  async (req, res) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, 'title');
      res.render('bookinstance_form', {
        title: 'Update BookInstance',
        book_list: allBooks,
        selected_book: bookInstance.book,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
      return;
    }

    const updatedBookInstance = await BookInstance.findByIdAndUpdate(
      req.params.id,
      bookInstance,
      {}
    );
    res.redirect(updatedBookInstance.url);
  },
];
