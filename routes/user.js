var router = require('express').Router();
var UserClass = require('../common/user_class.js');
var AV = require('leanengine');

// 查询关注者列表
router.get('/', function(req, res, next) {
   var userclass = new UserClass();
   userclass.config_lastAccessTime('orSEhuBllBij-g3Ayx2jujBuuPNY');
   res.send('last access time has configed');
   //res.render('user', { followers: global.followers});
});

module.exports = router;
