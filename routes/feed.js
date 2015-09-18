var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js

var Group = AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');

//  feed 结果
router.get('/', function(req, res, next) {
	var query = new AV.Query(Feed);
    query.descending('createdAt');
    query.find({
    success: function(feeds) {
      res.render('feed', {
        title: 'Feed 列表',
        feeds: feeds,
        username: req.query.username
      });
    },
    error: function(err) {
      if (err.code === 101) {
        // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
        // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
        res.render('todos', {
          title: 'TODO 列表',
          feeds: []
        });
      } else {
        next(err);
      }
    }
  });
});

// 新增 feed
router.post('/post', function(req, res, next) {
  var groupObjId=req.body.groupObjId;
  var feedContent=req.body.feedContent;
  var feedclass = new FeedClass();
  console.log(req.query.username);
  feedclass.postFeed_text(groupObjId,req.query.username,feedContent); 
   res.redirect('/feed?username='+req.query.username);
})



module.exports = router;
