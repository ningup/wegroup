var router = require('express').Router();
var AV = require('leanengine');
//var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
//var LikeClass = require('../common/like_class.js');
var CommentClass = require('../common/comment_class.js');
//var Group = AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var Comment = AV.Object.extend('Comment');

//  feed 结果
router.get('/', function(req, res, next) {
	var commentclass = new CommentClass();
	commentclass.addComment('55fc293860b21fbf5733ec7d','first comment','orSEhuNxAkianv5eFOpTJ3LXWADE','orSEhuNxAkianv5eFOpTJ3LXWADE');
	res.send('comment success');
	
});

// 新增 feed
router.post('/post', function(req, res, next) {
  
})



module.exports = router;