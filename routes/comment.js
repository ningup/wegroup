var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var CommentClass = require('../common/comment_class.js');
var UserClass = require('../common/user_class.js'); 
var MsgClass = require('../common/msg_class.js');
//var Group = AV.Object.extend('Group');
var OAuth = require('wechat-oauth');
var config = require('../config/config.js');
var client = new OAuth(config.appid, config.appsecret);
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var msgclass = new MsgClass();
//var Feed = AV.Object.extend('Feed');
//var Comment = AV.Object.extend('Comment');
var api = new WechatAPI(config.appid, config.appsecret, function (callback) {
  // 传入一个获取全局token的方法
   var query = new AV.Query('WechatToken');
   query.get("5606afe9ddb2e44a47769124", {
  success: function(obj) {
    // 成功获得实例
    callback(null, JSON.parse(obj.get('accessToken')));
  },
  error: function(object, error) {
    // 失败了.
  }
});
  
}, function (token, callback) {
  // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
  // 这样才能在cluster模式及多机情况下使用，以下为写入到文件的示例
  //fs.writeFile('access_token.txt', JSON.stringify(token), callback);
	  var query = new AV.Query('WechatToken');
	  query.get("5606afe9ddb2e44a47769124", {
	  success: function(wechatToken) {
		// 成功获得实例
	   wechatToken.set('accessToken',JSON.stringify(token));
	   wechatToken.save().then(function(obj){});
		
	  },
	  error: function(object, error) {
		// 失败了.
	  }
	});
   
})

router.post('/', function(req, res, next) {
	var username = req.body.username;
	var groupObjId = req.body.groupObjId;
	var content = req.body.content;
	var toWhom = req.body.toWhom;
	var feedObjId = req.body.feedObjId;
	var commentType = req.body.commentType;
	var isReply = req.body.isReply;
	var imgurl = "voidvoid";
	if(commentType==='text'){
		var commentImgArray = new Array();
	}
	else if(commentType ==='imgtext'){
		var commentImgArray = req.body.commentImgArray;
		console.log("commentImgArray"+commentImgArray);
		commentImgArray = commentImgArray.split(',');
		imgurl = commentImgArray[0];
	}
	else{}
	if(isReply==='1'){
		var replyCommentId = req.body.replyCommentId;
		var inWhichComment = req.body.inWhichComment;
		var commentclass = new CommentClass();
		commentclass.addComment(groupObjId,feedObjId,content,username,toWhom,commentType,isReply,commentImgArray,replyCommentId,inWhichComment,function(comment,nickname,headimgurl,groupName){
			if(inWhichComment == replyCommentId){
				msgclass.feedMsg(toWhom,'c_reply',content,username,nickname,headimgurl,groupObjId,inWhichComment,feedObjId,groupName,imgurl,function(){
				});
			}
			else{
				msgclass.feedMsg(toWhom,'r_reply',content,username,nickname,headimgurl,groupObjId,inWhichComment,feedObjId,groupName,imgurl,function(){
				});
			}
			res.json({"nickname":nickname,"toNickname":comment.get('toNickname'),"content":content,"username":username,"toWhom":toWhom,"commentObjId":comment.getObjectId(),"replyCommentId":comment.get('replyCommentId'),"replyTime":comment.getCreatedAt()});
			return ;
		});
	}
	else if(isReply==='0'){
		var replyCommentId = '0';
		var inWhichComment = '0';
		var commentclass = new CommentClass();
		commentclass.addComment(groupObjId,feedObjId,content,username,toWhom,commentType,isReply,commentImgArray,replyCommentId,inWhichComment,function(comment,nickname,headimgurl,groupName){
			res.redirect('/comment/detail?cid='+comment.getObjectId()+'&toWhom='+comment.get('who')+'&fid='+feedObjId);
			msgclass.feedMsg(toWhom,'f_comment',content,username,nickname,headimgurl,groupObjId,comment.getObjectId(),feedObjId,groupName,imgurl,function(){
				//res.redirect('/comment/detail?cid='+comment.getObjectId()+'&toWhom='+comment.get('who')+'&fid='+feedObjId);
			});
	});
	}
	else{}
	
});

router.get('/detail', function(req, res, next) {
		var cid = req.query.cid;
		var fid = req.query.fid;
		var toWhom = req.query.toWhom;
		console.log('detail');
		var userclass = new UserClass();
	if (AV.User.current()) {
		var username = AV.User.current().get('username');
				var queryC = new AV.Query('Comment');
				queryC.get(cid, {
				  success: function(comment) {
					// 成功获得实例
					userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
						var groupObjId = whichGroupNow;
						if(err){
						 res.send('你还没有加入群呢，快去创建一个吧！');
						}
						else{
						var query = new AV.Query('Comment');
						query.ascending('createdAt');
						query.equalTo('isReply','1');
						query.equalTo('isRemoved',0);
						query.equalTo('inWhichComment',cid);
						query.limit(25);
						query.find({
							success: function(comments) {
								// 成功了
								console.log(comments.length);
								var elseComment = '0';
								if(comments.length >=25)
										elseComment = '1';
								console.log('elseComment'+elseComment);
								res.render('lyh_test_replyall', {
									username: username,
									toWhom:toWhom,
									groupObjId:groupObjId,
									commentObjId:cid,
									feedObjId: fid,
									comments:comments,
									elseComment: elseComment,
									c:comment
								});

							},
							error: function(error) {
								alert("Error: " + error.code + " " + error.message);
							}
						});
						}
					});
				  },
				  error: function(error) {
					// 失败了.
				  }
			  });
	}
	else{
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

router.post('/more', function(req, res, next) {
		var cid = req.body.inWhichComment;
		var skipCount = req.body.skipCount;
		var query = new AV.Query('Comment');
		query.ascending('createdAt');
		query.equalTo('isReply','1');
		query.equalTo('isRemoved',0);
		query.equalTo('inWhichComment',cid);
		query.limit(25);
		query.skip(skipCount);
		query.find({
			success: function(comments) {
				var elseComment = '0';
				if(comments.length>=25)
					elseComment = '1';
				console.log('more');
				console.log(elseComment+"   "+comments.length+"   "+skipCount);
				res.json({"elseComment":elseComment,"comments":comments});
				return ;
					
			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
		});
  
});


router.post('/like', function(req, res, next) {
	username = req.body.username;
	feedObjId = req.body.feedObjId;
	//username = username.trim();
	var likeclass = new LikeClass();
	likeclass.like(feedObjId,username,function(err, feedObj){
		res.json({"status":1,"msg":"like successful","likeNum":feedObj.get('likeNum'),"feedObjId":feedObj.getObjectId()});
		return ;
	});
	
});

router.post('/unlike', function(req, res, next) {
	username = req.body.username;
	feedObjId = req.body.feedObjId;
	//username = username.trim();
	var likeclass = new LikeClass();
	likeclass.unlike(feedObjId,username,function(err, feedObj){
		res.json({"status":1,"msg":"unlike successful","likeNum":feedObj.get('likeNum'),"feedObjId":feedObj.getObjectId()});
		return ;
	});
	
});

router.get('/msg/detail', function(req, res, next) {
	var cid = req.query.cid;
	var fid = req.query.fid;
	var toWhom = req.query.toWhom;
	var groupObjId = req.query.gid;
	var msgType = req.query.msgType;
	console.log('detail');
	var userclass = new UserClass();
	if (AV.User.current()) {
		var username = AV.User.current().get('username');
		var queryC = new AV.Query('Comment');
		queryC.get(cid, {
			success: function(comment) {
			// 成功获得实例
			userclass.isGroupJoined(username,groupObjId,function(status,results){
				if(status == 2){
				 res.send('你不在这个群里了!');
				}
				else if(status == 0){
				 res.send('你没关注微群帮手');
				}
				else{
					var queryF = new AV.Query('Feed');
					queryF.get(fid, {
						success: function(feed) {
							// 成功获得实例
							if(feed.get('isRemoved')==1){
								res.send('该话题被删除了');
							}
							else{
								if(msgType == 'f_comment' || msgType == 'c_reply' || msgType == 'r_reply'){
									var query = new AV.Query('Comment');
									query.ascending('createdAt');
									query.equalTo('isReply','1');
									query.equalTo('isRemoved',0);
									query.containedIn("who",[username, toWhom]);
									query.containedIn("toWhom",[username, toWhom]);
									query.equalTo('inWhichComment',cid);
									query.limit(25);
									query.find({
										success: function(comments) {
											// 成功了
											console.log(comments.length);
											var elseComment = '0';
											if(comments.length >=25)
													elseComment = '1';
											console.log('elseComment'+elseComment);
											res.render('msg_reply', {
												username: username,
												toWhom:toWhom,
												groupObjId:groupObjId,
												commentObjId:cid,
												feedObjId: fid,
												comments:comments,
												elseComment: elseComment,
												c:comment
											});

										},
										error: function(error) {
											alert("Error: " + error.code + " " + error.message);
										}
									});
								}
							}
						},
						error: function(error) {
							// 失败了.
						}
					});

				}
			});
			},
			error: function(error) {
			// 失败了.
			}
		});
	}
	else{
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

router.post('/msg/more', function(req, res, next) {
		var cid = req.body.inWhichComment;
		var skipCount = req.body.skipCount;
		var username = req.body.username;
		var toWhom = req.body.toWhom;
		var query = new AV.Query('Comment');
		console.log('aaaa');
		query.ascending('createdAt');
		query.equalTo('isReply','1');
		query.equalTo('isRemoved',0);
		query.equalTo('inWhichComment',cid);
		query.containedIn("who",[username, toWhom]);
		query.containedIn("toWhom",[username, toWhom]);
		query.limit(25);
		query.skip(skipCount);
		query.find({
			success: function(comments) {
				var elseComment = '0';
				if(comments.length>=25)
					elseComment = '1';
				console.log('more');
				console.log(elseComment+"   "+comments.length+"   "+skipCount);
				res.json({"elseComment":elseComment,"comments":comments});
				return ;
					
			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
		});
  
});


module.exports = router;
