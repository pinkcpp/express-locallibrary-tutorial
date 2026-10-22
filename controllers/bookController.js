const createError = require('http-errors');
const { body, validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');

/**
 * 编目首页：汇总各集合的数量。
 * @type {import('express').RequestHandler}
 */
exports.index = async (req, res) => {
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: 'Available' }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);

  res.render('index', {
    title: 'Local Library Home',
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  });
};

/**
 * 呈现数据库中所有图书的列表。
 * @type {import('express').RequestHandler}
 */
exports.book_list = async (req, res) => {
  const allBooks = await Book.find({}, 'title author')
    .sort({ title: 1 })
    .populate('author')
    .exec();

  // ========== 打印代码，加在这里 ==========
  console.log('所有图书数组：', allBooks);
  // =======================================

  res.render('book_list', { title: 'Book List', book_list: allBooks });
};

/**
 * 显示特定图书的详情页面。
 * @type {import('express').RequestHandler}
 */
exports.book_detail = async (req, res) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre'),
    BookInstance.find({ book: req.params.id }),
  ]);

  if (book === null) {
    throw createError(404, 'Book not found');
  }

  res.render('book_detail', {
    title: book.title,
    book: book,
    book_instances: bookInstances,
  });
};

/**
 * GET /catalog/book/create：渲染创建图书表单。
 * @type {import('express').RequestHandler}
 */
exports.book_create_get = async (req, res) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().sort({ family_name: 1 }),
    Genre.find().sort({ name: 1 }),
  ]);

  res.render('book_form', {
    title: 'Create Book',
    authors: allAuthors,
    genres: allGenres,
  });
};

/**
 * POST /catalog/book/create：校验并保存新图书，失败时回显表单。
 * @type {import('express').RequestHandler[]}
 */
exports.book_create_post = [
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  body('genre.*').escape(),

  async (req, res) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });

    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }),
        Genre.find().sort({ name: 1 }),
      ]);

      // 勾选状态回填
      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = 'true';
        }
      }

      res.render('book_form', {
        title: 'Create Book',
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    }

    await book.save();
    res.redirect(book.url);
  },
];

/**
 * 通过 GET 显示删除图书（未实现）。
 * @type {import('express').RequestHandler}
 */
exports.book_delete_get = async (req, res) => {
  res.send('未实现：删除 GET');
};

/**
 * 以 POST 方式处理删除图书（未实现）。
 * @type {import('express').RequestHandler}
 */
exports.book_delete_post = async (req, res) => {
  res.send('未实现：删除 POST');
};

/**
 * GET /catalog/book/:id/update：渲染更新图书表单。
 * @type {import('express').RequestHandler}
 */
exports.book_update_get = async (req, res) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre'),
    Author.find().sort({ family_name: 1 }),
    Genre.find().sort({ name: 1 }),
  ]);

  if (book === null) {
    throw createError(404, 'Book not found');
  }

  // 回填多选框勾选状态
  for (const genre of allGenres) {
    for (const bookG of book.genre) {
      if (genre._id.toString() === bookG._id.toString()) {
        genre.checked = 'true';
      }
    }
  }

  res.render('book_form', {
    title: 'Update Book',
    authors: allAuthors,
    genres: allGenres,
    book: book,
  });
};

/**
 * POST /catalog/book/:id/update：校验并更新图书，失败时回显表单。
 * @type {import('express').RequestHandler[]}
 */
exports.book_update_post = [
  body('title', 'Title must not be empty.').trim().isLength({ min: 1 }),
  body('author', 'Author must not be empty.').trim().isLength({ min: 1 }),
  body('summary', 'Summary must not be empty.').trim().isLength({ min: 1 }),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }),
  body('genre.*').escape(),

  async (req, res) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().sort({ family_name: 1 }),
        Genre.find().sort({ name: 1 }),
      ]);

      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = 'true';
        }
      }

      res.render('book_form', {
        title: 'Update Book',
        authors: allAuthors,
        genres: allGenres,
        book: book,
        errors: errors.array(),
      });
      return;
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
    res.redirect(updatedBook.url);
  },
];
