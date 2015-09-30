var router = require('express').Router();
var AV = require('leanengine');
//var GroupClass = require('../common/group_class.js'); //引入group_class.js
//var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var CommentClass = require('../common/comment_class.js');
//var Group = AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var Comment = AV.Object.extend('Comment');

//  feed 结果
router.post('/', function(req, res, next) {
	var username = req.body.username;
	var content = req.body.content;
	var toWhom = req.body.toWhom;
	var feedObjId = req.body.feedObjId;
	var commentclass = new CommentClass();
	username = username.trim();
	commentclass.addComment(feedObjId,content,username,toWhom,function(nickname,headimgurl){
		res.json({"nickname":nickname,"headimgurl":headimgurl,"content":content,"username":username,"toWhom":toWhom});
		return ;
	});
	
	
});


router.post('/post', function(req, res, next) {
  
})

router.post('/like', function(req, res, next) {
	username = req.body.username;
	feedObjId = req.body.feedObjId;
	username = username.trim();
	var likeclass = new LikeClass();
	likeclass.like(feedObjId,username,function(err, feedObj){
		res.json({"status":1,"msg":"like successful","likeNum":feedObj.get('likeNum')});
		return ;
	});
	
})




module.exports = router;
