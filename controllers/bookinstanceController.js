const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require('express-validator');

// 呈现所有书本实例（BookInstance）的列表
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
 const allBookInstances = await BookInstance.find().populate('book');
  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances,
  });
});

// 详情 GET /catalog/bookinstance/:id
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book');
  if (bookInstance === null) {
    const err = new Error('Book copy not found');
    err.status = 404;
    return next(err);
  }
  res.render('bookinstance_detail', {
    title: 'Copy: ' + bookInstance.book.title,
    bookinstance: bookInstance
  });
});

// 创建 GET 表单 /catalog/bookinstance/create
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, 'title');
  res.render('bookinstance_form', {
    title: 'Create BookInstance',
    book_list: allBooks
  });
});

// 创建 POST 提交
exports.bookinstance_create_post = [
  // 表单校验
  body('book', 'Book must be specified').trim().isLength({ min: 1 }),
  body('imprint', 'Imprint must be specified').trim().isLength({ min: 1 }),
  body('status').trim().notEmpty(),
  body('due_back', 'Invalid date').optional({ values: 'falsy' }).isISO8601(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if (!errors.isEmpty()) {
      // 校验失败，重新渲染表单
      const allBooks = await Book.find({}, 'title');
      res.render('bookinstance_form', {
        title: 'Create BookInstance',
        book_list: allBooks,
        selected_book: bookInstance.book ? bookInstance.book._id : '',
        bookinstance: bookInstance,
        errors: errors.array()
      });
      return;
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  })
];

// 由 GET 显示删除 BookInstance 的表单
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 删除 GET");
});

// 由 POST 删除 BookInstance
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 删除 POST");
});

// 由 GET 显示更新 BookInstance 的表单
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 更新 GET");
});

// 由 POST 处理更新 BookInstance
exports.bookinstance_update_post = asyncHandler(async (req, res, next) => {
  res.send("未实现：BookInstance 更新 POST");
});