var router = require('express').Router();
var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var fs = require('fs');
var path= require('path');
var OAuth = require('wechat-oauth');
var client = new OAuth('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
var sign=require('../common/sign.js');
var Group = AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c', function (callback) {
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
   
});
//  feed 结果
router.get('/', function(req, res, next) {
	//var likeclass = new LikeClass();
	//likeclass.like('55fc293860b21fbf5733ec7d',req.query.username);
	var username = req.query.username;
	var groupObjIdGotInto = req.query.groupObjIdGotInto;
	username = username.trim();
	var query = new AV.Query('Group');
	query.get(groupObjIdGotInto, {
	  success: function(group) {
		// 成功获得实例
		 console.log('you get into the '+ group.get('nickname'));
		 var relation = group.relation("feedPosted");
		 relation.targetClassName = 'Feed';
		 var queryFeed = relation.query();
		 queryFeed.find().then(function(feeds){
			 var j =0;
			    //var comments = new Array();
			    for(var i = 0 ; i< feeds.length; i++){
					(function(i){
						var relationC = feeds[i].relation("feedComment");
						relation.targetClassName = 'comment';
						var queryComment = relationC.query();
						queryComment.find().then(function(comments){
						    feeds[i].comments = new Array();
							feeds[i].comments = comments;
							j++;
							if(j === feeds.length){
							   res.render('feed', {
								groupObjIdGotInto:groupObjIdGotInto,
								feeds: feeds,
								username: username
							  });
						
							}
							
					  });
						
					})(i);
					
						
				}
			    
			     
				
		
		 });
		
	  },
	  error: function(object, error) {
		// 失败了.
	  }
	});
   
});

router.get('/publish', function(req, res, next) {
	var username = req.query.username;
	var groupObjIdGotInto = req.query.groupObjIdGotInto;
    var ticket;
    var groupclass = new GroupClass();
    var query = new AV.Query('WechatTicket');
     query.get("5606be0760b294604924a0c5", {
	   success: function(obj) {
		// 成功获得实例
		if((new Date().getTime()) < (JSON.parse(obj.get('ticket')).expireTime)){
				ticket = JSON.parse(obj.get('ticket')).ticket;
				var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/feed/publish?groupObjIdGotInto='+groupObjIdGotInto+'&username='+username);
				console.log('not exoired'+ticket);
				console.log('.............'+jsapi.nonceStr);
				res.render('feed_publish', {
					//title: 'Groups 列表',
					groupObjIdGotInto:groupObjIdGotInto,
					username: username,
					nonceStr: jsapi.nonceStr,
					timestamp: jsapi.timestamp,
					signature: jsapi.signature
					//groups: results
				});
			}
			else{
				api.getLatestToken(function(){});
				api.getTicket(function(err,results){
					//console.log(JSON.stringify(results));
					console.log('guoqi?');
					ticket = results.ticket;
					obj.set('ticket',JSON.stringify(results));
					obj.save().then(function(obj){
						console.log('ticket expire time'+results.expireTime);
						var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/feed/publish?groupObjIdGotInto='+groupObjIdGotInto+'&username='+username);
						//console.log('.............'+jsapi.nonceStr);
						res.render('feed_publish', {
							//title: 'Groups 列表',
							groupObjIdGotInto:groupObjIdGotInto,
							username: username,
							nonceStr: jsapi.nonceStr,
							timestamp: jsapi.timestamp,
							signature: jsapi.signature
							//groups: results
						});
						
					
					});

				});
		
			}
	  },
	  error: function(object, error) {
		// 失败了.
	  }
});


});
router.get('/groupMember', function(req, res, next) {
	var username = req.query.username;
	var groupObjIdGotInto = req.query.groupObjIdGotInto;
	//username = username.trim();
	var query = new AV.Query('Group');
	query.get(groupObjIdGotInto, {
	  success: function(group) {
		// 成功获得实例
		 console.log('you get into the '+ group.get('nickname'));
		 var relation = group.relation('followers');
		 //relation.targetClassName = AV.User;
		 var queryFollowers = relation.query();
		 queryFollowers.find().then(function(users){
				res.render('feed_member', {
				groupObjIdGotInto:groupObjIdGotInto,
				users: users,
				followersNum:group.get('followersNum'),
				username: username
			  });
		
		 });
		
	  },
	  error: function(object, error) {
		// 失败了.
	  }
	});
	

});

// 新增 feed
router.post('/post', function(req, res, next) {
  var groupObjId=req.body.groupObjId;
  var feedContent=req.body.feedContent;
  var feedType = req.body.feedType;
  feedType = feedType.trim();
  var username = req.body.username;
  username = username.trim();
  var feedclass = new FeedClass(); 
  if(feedType != 'text'){
  	var serverId = req.body.serverId;
  	serverId=JSON.parse(serverId).serverId;
  }
  console.log('feedType'+feedType);
  if(feedType === 'text'){
  	  console.log('into the text post');
	  feedclass.postFeed_text(groupObjId,username,feedContent,function(){
			res.redirect('/feed?username='+username+'&groupObjIdGotInto='+groupObjId);
	   }); 
  }else if (feedType === 'imgtext'){
		feedclass.postFeed_imgtext(groupObjId,username,feedContent,serverId,function(){
			res.redirect('/feed?username='+username+'&groupObjIdGotInto='+groupObjId);
	   }); 
  }else if (feedType === 'vote'){
  
  
  }
  
});



module.exports = router;
