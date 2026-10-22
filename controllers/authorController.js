const createError = require('http-errors');
const { body, validationResult } = require('express-validator');

const Book = require('../models/book');
const Author = require('../models/author');

/**
 * 呈现所有作者的列表。
 * @type {import('express').RequestHandler}
 */
exports.author_list = async (req, res) => {
  const list_authors = await Author.find().sort({ family_name: 1 });
  res.render('author_list', {
    title: 'Author List',
    author_list: list_authors,
  });
};

/**
 * 呈现指定作者的详情页。
 * @type {import('express').RequestHandler}
 */
exports.author_detail = async (req, res) => {
  // （并行地）获取作者的详细信息及其所有作品
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, 'title summary').exec(),
  ]);

  if (author === null) {
    throw createError(404, 'Author not found');
  }

  res.render('author_detail', {
    title: 'Author Detail',
    author: author,
    author_books: allBooksByAuthor,
  });
};

/**
 * GET /catalog/author/create：渲染创建作者表单。
 * @type {import('express').RequestHandler}
 */
exports.author_create_get = (req, res) => {
  res.render('author_form', { title: 'Create Author' });
};

/**
 * POST /catalog/author/create：校验并保存新作者，失败时回显表单。
 * @type {import('express').RequestHandler[]}
 */
exports.author_create_post = [
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('First name must be specified.'),
  body('family_name')
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage('Family name must be specified.'),
  body('date_of_birth', 'Invalid date of birth').optional({ values: 'falsy' }).isISO8601(),
  body('date_of_death', 'Invalid date of death').optional({ values: 'falsy' }).isISO8601(),

  async (req, res) => {
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
      res.render('author_form', {
        title: 'Create Author',
        author: author,
        errors: errors.array(),
      });
      return;
    }

    await author.save();
    res.redirect(author.url);
  },
];

/**
 * GET /catalog/author/:id/delete：删除确认页。
 * @type {import('express').RequestHandler}
 */
exports.author_delete_get = async (req, res) => {
  const [author, authorBooks] = await Promise.all([
    Author.findById(req.params.id),
    Book.find({ author: req.params.id }),
  ]);

  if (author === null) {
    res.redirect('/catalog/authors');
    return;
  }

  res.render('author_delete', {
    title: 'Delete Author',
    author: author,
    author_books: authorBooks,
  });
};

/**
 * POST /catalog/author/:id/delete：删除无关联图书的作者。
 * @type {import('express').RequestHandler}
 */
exports.author_delete_post = async (req, res) => {
  const [author, authorBooks] = await Promise.all([
    Author.findById(req.params.id),
    Book.find({ author: req.params.id }),
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
      author_books: authorBooks,
    });
    return;
  }

  await Author.findByIdAndDelete(req.body.authorid);
  res.redirect('/catalog/authors');
};

/**
 * 由 GET 显示更新作者的表单（未实现）。
 * @type {import('express').RequestHandler}
 */
exports.author_update_get = async (req, res) => {
  res.send('未实现：更新作者的 GET');
};

/**
 * 由 POST 处理作者更新操作（未实现）。
 * @type {import('express').RequestHandler}
 */
exports.author_update_post = async (req, res) => {
  res.send('未实现：更新作者的 POST');
};
