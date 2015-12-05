var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var CommentClass = require('../common/comment_class.js');
var UserClass = require('../common/user_class.js'); 
var Group = AV.Object.extend('Group');
var OAuth = require('wechat-oauth');
var config = require('../config/config.js');
var client = new OAuth(config.appid, config.appsecret);
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var Feed = AV.Object.extend('Feed');
var Comment = AV.Object.extend('Comment');
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
	if(commentType==='text'){
		var commentImgArray = new Array();
	}
	else if(commentType ==='imgtext'){
		var commentImgArray = req.body.commentImgArray;
		console.log(commentImgArray);
		commentImgArray = commentImgArray.split(',');
	}
	else{}
	
	if(isReply==='1'){
		var replyCommentId = req.body.replyCommentId;
		var inWhichComment = req.body.inWhichComment;
		var commentclass = new CommentClass();
		commentclass.addComment(groupObjId,feedObjId,content,username,toWhom,commentType,isReply,commentImgArray,replyCommentId,inWhichComment,function(comment,nickname,headimgurl){
		res.json({"nickname":nickname,"toNickname":comment.get('toNickname'),"content":content,"username":username,"toWhom":toWhom,"commentObjId":comment.getObjectId(),"replyCommentId":comment.get('replyCommentId'),"replyTime":comment.getCreatedAt()});
		return ;
		});
	}
	else if(isReply==='0'){
		var replyCommentId = '0';
		var inWhichComment = '0';
		var commentclass = new CommentClass();
		commentclass.addComment(groupObjId,feedObjId,content,username,toWhom,commentType,isReply,commentImgArray,replyCommentId,inWhichComment,function(comment,nickname,headimgurl){
		res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/comment/detail?cid='+comment.getObjectId()+'&toWhom='+comment.get('who')+'&fid='+feedObjId+'&response_type=code&scope=snsapi_base&state=123#wechat_redirect');
		 //res.redirect('/comment/detail?cid='+comment.getObjectId()+'&toWhom='+comment.get('who')+'&fid='+feedObjId);
	});
	}
	else{}
	
});

router.get('/detail', function(req, res, next) {
		var cid = req.query.cid;
		var fid = req.query.fid;
		var toWhom = req.query.toWhom;
		var userclass = new UserClass();
	  client.getAccessToken(req.query.code, function (err, result) {
			if(err){
				//res.redirect('/group/fini?title=');	
				var username = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
				cid = '5661e1f160b202595a584ad2';
				toWhom = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
				fid = '56605d1160b21eab5d3db031';
				userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
					 var groupObjId = whichGroupNow;
					 if(err){
						 res.send('你还没有加入群呢，快去创建一个吧！');
					 }
					 else{
							var query = new AV.Query('Comment');
							query.ascending('createdAt');
							query.equalTo('isReply','1');
							query.equalTo('inWhichComment',cid);
							query.limit(25);
							query.find({
								success: function(comments) {
									var queryall = new AV.Query('Comment');
									queryall.ascending('createdAt');
									queryall.equalTo('isReply','1');
									queryall.equalTo('inWhichComment',cid);
									queryall.limit(100);
									queryall.count({
										success: function(count) {
											// 成功了
											console.log(comments.length);
											console.log(count);
											var elseCommet = '0';
											if(comments.length < count){
												var elseCommet = '1';
											}
											console.log('elseCommet'+elseCommet);
											res.render('lyh_test_replyall', {
												username: username,
												toWhom:toWhom,
												groupObjId:groupObjId,
												commentObjId:cid,
												feedObjId: fid,
												comments:comments,
												elseCommet: elseCommet
											});
							
										},
										error: function(error) {
											// 失败了
										}
									});
										
								},
								error: function(error) {
									alert("Error: " + error.code + " " + error.message);
								}
							});
					 }
				});
			}else{
				 var username = result.data.openid;
				 userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
					 var groupObjId = whichGroupNow;
					 if(err){
						 res.send('你还没有加入群呢，快去创建一个吧！');
					 }
					 else{
							var query = new AV.Query('Comment');
							query.ascending('createdAt');
							query.equalTo('isReply','1');
							query.equalTo('inWhichComment',cid);
							query.limit(25);
							query.find({
								success: function(comments) {
									var queryall = new AV.Query('Comment');
									queryall.ascending('createdAt');
									queryall.equalTo('isReply','1');
									queryall.equalTo('inWhichComment',cid);
									queryall.limit(100);
									queryall.count({
										success: function(count) {
											// 成功了
											//console.log(comments.length);
											var elseCommet = '0';
											if(comments.length < count){
												var elseCommet = '1';
											}
											console.log('elseCommet'+elseCommet);
											res.render('lyh_test_replyall', {
												username: username,
												toWhom:toWhom,
												groupObjId:groupObjId,
												commentObjId:cid,
												feedObjId: fid,
												comments:comments,
												elseCommet: elseCommet
											});
							
										},
										error: function(error) {
											// 失败了
										}
									});
										
								},
								error: function(error) {
									alert("Error: " + error.code + " " + error.message);
								}
							});
					 }
				});

	    }
	 });		
});

router.post('/more', function(req, res, next) {
		var cid = req.body.inWhichComment;
		var skipCount = req.body.skipCount;
		var query = new AV.Query('Comment');
		query.ascending('createdAt');
		query.equalTo('isReply','1');
		query.equalTo('inWhichComment',cid);
		query.limit(25);
		query.skip(skipCount);
		query.find({
			success: function(comments) {
				var queryall = new AV.Query('Comment');
				queryall.ascending('createdAt');
				queryall.equalTo('isReply','1');
				queryall.equalTo('inWhichComment',cid);
				queryall.limit(100);
				queryall.skip(skipCount);
				queryall.count({
					success: function(count) {
						// 成功了
						//console.log(comments.length);
						var elseCommet = '0';
						if(comments.length < count){
							var elseCommet = '1';
						}
						console.log('elseCommet'+elseCommet);
						res.json({"elseCommet":elseCommet,"comments":comments});
						return ;
		
					},
					error: function(error) {
						// 失败了
					}
				});
					
			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
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
