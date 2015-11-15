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
	var groupObjId = req.body.groupObjId;
	var content = req.body.content;
	var toWhom = req.body.toWhom;
	var feedObjId = req.body.feedObjId;
	var commentType = req.body.commentType;
	var isReply = req.body.isReply;
	if(commentType==='text'){
		var commentImgArray = [];
	}
	else if(commentType ==='imgtext'){
		var commentImgArray = req.body.commentImgArray;
		commentImgArray = commentImgArray.split(',');
	}
	else{}
	
	if(isReply==='1'){
		var replyCommentId = req.body.replyCommentId;
	}
	else if(isReply==='0'){
		var replyCommentId = '0';
	}
	else{}
	var commentclass = new CommentClass();
	commentclass.addComment(groupObjId,feedObjId,content,username,toUsername,commentType,isReply,commentImgArray,replyCommentId,function(nickname,headimgurl){
		res.json({"nickname":nickname,"headimgurl":headimgurl,"content":content,"username":username,"toWhom":toWhom,"feedObjId":feedObjId});
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
		res.json({"status":1,"msg":"like successful","likeNum":feedObj.get('likeNum'),"feedObjId":feedObj.getObjectId()});
		return ;
	});
	
})




module.exports = router;
