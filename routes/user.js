var router = require('express').Router();
var AV = require('leanengine');
// `AV.Object.extend` 方法一定要放在全局变量，否则会造成堆栈溢出。
// 详见： https://leancloud.cn/docs/js_guide.html#对象
var Todo = AV.Object.extend('Todo');
// 查询关注者列表
router.get('/', function(req, res, next) {
   //res.render('user', { currentTime: new Date() });
   //res.render('user', { followers: global.followers});
});

module.exports = router;
