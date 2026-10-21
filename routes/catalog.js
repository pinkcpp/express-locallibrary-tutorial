const express = require("express");
const router = express.Router();

// 导入控制器模块
const book_controller = require("../controllers/bookController");
const author_controller = require("../controllers/authorController");
const genreController = require("../controllers/genreController");
const book_instance_controller = require("../controllers/bookinstanceController");



// GET 获取图书编目主页
router.get("/", book_controller.index);

/// 图书路由 ///
router.get("/books", book_controller.book_list); //完整图书列表
router.get("/book/create", book_controller.book_create_get); //创建get
router.post("/book/create", book_controller.book_create_post); //创建post

router.get("/book/:id", book_controller.book_detail); //图书详情
router.get("/book/:id/delete", book_controller.book_delete_get); //删除get
router.post("/book/:id/delete", book_controller.book_delete_post); //删除po
router.get("/book/:id/update", book_controller.book_update_get); //更新get
router.post("/book/:id/update", book_controller.book_update_post); //更新post

/// 作者路由 ///
router.get("/authors", author_controller.author_list); //作者列表
router.get("/author/create", author_controller.author_create_get); //创建get
router.post("/author/create", author_controller.author_create_post); //创建post

router.get("/author/:id", author_controller.author_detail); //作者详情
router.get("/author/:id/delete", author_controller.author_delete_get); //删除get
router.post("/author/:id/delete", author_controller.author_delete_post); //删除post
router.get("/author/:id/update", author_controller.author_update_get); //更新get
router.post("/author/:id/update", author_controller.author_update_post); //更新post

/// 图书种类路由 ///
router.get("/genres", genreController.genre_list);//列表
router.get("/genre/create", genreController.genre_create_get); //创建get
router.post("/genre/create", genreController.genre_create_post); //创建post
router.get("/genre/:id", genreController.genre_detail); //详情


/// BOOKINSTANCE 路由 ///
router.get("/bookinstances", book_instance_controller.bookinstance_list); // BookInstance 的列表。
router.get("/bookinstance/create",book_instance_controller.bookinstance_create_get,);  //创建get
router.post("/bookinstance/create",book_instance_controller.bookinstance_create_post,);//创建post

router.get("/bookinstance/:id", book_instance_controller.bookinstance_detail); // BookInstance 详情。
router.post("/bookinstance/:id/delete",book_instance_controller.bookinstance_delete_get,); //删除get
router.post("/bookinstance/:id/delete",book_instance_controller.bookinstance_delete_post,); //删除post
router.get("/bookinstance/:id/update",book_instance_controller.bookinstance_update_get,); //更新get
router.post("/bookinstance/:id/update",book_instance_controller.bookinstance_update_post,); //更新post



module.exports = router;