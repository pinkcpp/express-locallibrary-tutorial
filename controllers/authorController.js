const Book = require("../models/book");
const Author = require("../models/author");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
    const list_authors = await Author.find().sort({ family_name: 1 });
    res.render('author_list', {
        title: 'Author List',
        author_list: list_authors
    });
});

// 呈现指定作者的详情页。
exports.author_detail = asyncHandler(async (req, res, next) => {
  // （并行地）获取作者的详细信息及其所有作品
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // 没有结果。
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// 展示 GET 方法获取的创建作者表单
exports.author_create_get = (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
};

// 处理 POST 方法提交的创建作者表单
exports.author_create_post = [
  // 验证并且清理字段
  body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First name must be specified.'),
  body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family name must be specified.'),
  body('date_of_birth', 'Invalid date of birth').optional({ values: 'falsy' }).isISO8601(),
  body('date_of_death', 'Invalid date of death').optional({ values: 'falsy' }).isISO8601(),

  // 在验证和修整完字段后处理请求
  asyncHandler(async (req, res, next) => {
    // 从请求中提取验证错误
    const errors = validationResult(req);

    // 使用经转义和去除空白字符处理的数据创建作者对象
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      // 出现错误。使用清理后的值/错误信息重新渲染表单
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      // 表格中的数据有效

      // 保存作者信息
      await author.save();
      // 重定向到新的作者记录
      res.redirect(author.url);
    }
  }),
];

// 删除作者 GET 确认页 /catalog/author/:id/delete
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  const [author, authorBooks] = await Promise.all([
    Author.findById(req.params.id),
    Book.find({ author: req.params.id })
  ]);

  if (author === null) {
    res.redirect('/catalog/authors');
    return;
  }

  res.render('author_delete', {
    title: 'Delete Author',
    author: author,
    author_books: authorBooks
  });
});

// 删除作者 POST 提交
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  const [author, authorBooks] = await Promise.all([
    Author.findById(req.params.id),
    Book.find({ author: req.params.id })
  ]);

  if (author === null) {
    res.redirect('/catalog/authors');
    return;
  }

  if (authorBooks.length > 0) {
    // 该作者还有关联书籍，禁止删除
    res.render('author_delete', {
      title: 'Delete Author',
      author: author,
      author_books: authorBooks
    });
    return;
  } else {
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect('/catalog/authors');
  }
});

// 由 GET 显示更新作者的表单
exports.author_update_get = asyncHandler(async (req, res, next) => {
  res.send("未实现：更新作者的 GET");
});

// 由 POST 处理作者更新操作
exports.author_update_post = asyncHandler(async (req, res, next) => {
  res.send("未实现：更新作者的 POST");
});