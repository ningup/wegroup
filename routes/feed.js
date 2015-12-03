var router = require('express').Router();
var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var UserClass = require('../common/user_class.js'); 
//var voteResults = require('../config/voteResults.json');
//var vote = require('../config/vote.json');
//var voteResultsWithoutUser = require('../config/voteResultsWithoutUser.json');
var fs = require('fs');
var path= require('path');
var OAuth = require('wechat-oauth');
var config = require('../config/config.js');
var client = new OAuth(config.appid, config.appsecret);
var sign=require('../common/sign.js');
var Group = AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
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
   
});
//  feed 结果
router.get('/', function(req, res, next) {
	//var likeclass = new LikeClass();
	//likeclass.like('55fc293860b21fbf5733ec7d',req.query.username);
	var userclass = new UserClass();
	client.getAccessToken(req.query.code, function (err, result) {
		if(err){
			 res.redirect('/group/fini?title=');		
			 //var username = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
			 //userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				 //if(err){
					 //res.send('你还没有加入群呢，快去创建一个吧！');
				 //}
				 //else{
					//var groupObjId = whichGroupNow;
					//var query = new AV.Query('Group');
					//query.get(groupObjId, {
					  //success: function(group) {
						//// 成功获得实例
						 ////console.log('you get into the '+ group.get('nickname'));
						 //var relation = group.relation("feedPosted");
						 //relation.targetClassName = 'Feed';
						 //var queryFeed = relation.query();
						 //queryFeed.notEqualTo('feedType','vote');
						 //queryFeed.descending('updateTime');
						 //queryFeed.limit(5);
						 ////queryFeed.equalTo("feedType", "vote");
						 //queryFeed.find().then(function(feeds){
						   //userclass.getUserObj(username,function(err,user){
							 //userclass.getSignInCnt(username,groupObjId, function(err,cnt,isSignIn){
								////console.log('groupnickname',nickname
								//var loadFeedTime = new Object();
								//if(feeds.length==0){
									//loadFeedTime.latest = new Date();
									//loadFeedTime.oldest = new Date();
									 
								//}else{
									//loadFeedTime.latest = feeds[0].get('updateTime');
									//loadFeedTime.oldest = feeds[(feeds.length)-1].get('updateTime');
									//user.set('loadFeedTime',loadFeedTime);
									
								//}
								//user.save();
								//res.render('band', {
									//username: username,
									//groupObjId:groupObjId,
									//cnt:cnt,
									//isSignIn:isSignIn,
									//feeds:feeds
								 //});
							//});
							
						 //});
							 

						 //});
						
					  //},
					  //error: function(object, error) {
						//// 失败了.
					  //}
					//});
				 //}
			//}); 
		}else{
				var username = result.data.openid;
			 userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				 if(err){
					 res.send('你还没有加入群呢，快去创建一个吧！');
				 }
				 else{
					var groupObjId = whichGroupNow;
					var query = new AV.Query('Group');
					query.get(groupObjId, {
					  success: function(group) {
						// 成功获得实例
						 //console.log('you get into the '+ group.get('nickname'));
						 var relation = group.relation("feedPosted");
						 relation.targetClassName = 'Feed';
						 var queryFeed = relation.query();
						 queryFeed.notEqualTo('feedType','vote');
						 queryFeed.descending('updateTime');
						 queryFeed.limit(5);
						 //queryFeed.equalTo("feedType", "vote");
						 queryFeed.find().then(function(feeds){
						   userclass.getUserObj(username,function(err,user){
							 userclass.getSignInCnt(username,groupObjId, function(err,cnt,isSignIn){
								//console.log('groupnickname',nickname
								var loadFeedTime = new Object();
								if(feeds.length==0){
									loadFeedTime.latest = new Date();
									loadFeedTime.oldest = new Date();
									 
								}else{
									loadFeedTime.latest = feeds[0].get('updateTime');
									loadFeedTime.oldest = feeds[(feeds.length)-1].get('updateTime');
									user.set('loadFeedTime',loadFeedTime);
									
								}
								user.save();
								res.render('band', {
									username: username,
									groupObjId:groupObjId,
									cnt:cnt,
									isSignIn:isSignIn,
									feeds:feeds
								 });
							});
							
						 });
							 

						 });
						
					  },
					  error: function(object, error) {
						// 失败了.
					  }
					});
				 }
			});
	    }
	 });

});
router.post('/history', function(req, res, next) {
		var userclass = new UserClass();
	 var username = req.body.username;
	 console.log('history'+username);
	 userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
		 if(err){
			 res.send('你还没有加入群呢，快去创建一个吧！');
		 }
		 else{
			var groupObjId = whichGroupNow;
			var query = new AV.Query('Group');
			query.get(groupObjId, {
				success: function(group) {
				// 成功获得实例
				 //console.log('you get into the '+ group.get('nickname'));
				 userclass.getUserObj(username,function(err,user){
						var loadFeedTime = user.get('loadFeedTime');
						var relation = group.relation("feedPosted");
						relation.targetClassName = 'Feed';
						var queryFeed = relation.query();
						queryFeed.notEqualTo('feedType','vote');
						queryFeed.descending('updateTime');
						queryFeed.lessThan("updateTime", loadFeedTime.oldest);
						queryFeed.limit(2);
						queryFeed.find().then(function(feeds){
								if(feeds.length != 0){
										loadFeedTime.oldest = feeds[(feeds.length)-1].get('updateTime');
										user.set('loadFeedTime',loadFeedTime);
										user.save();			
								}
								//res.json({"status":"0","feeds":1});
								res.json({"status":"0","feeds":feeds});
								return ;
								
						});

				 });
				 
				},
				error: function(object, error) {
				// 失败了.
				}
			});
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
//显示投票
router.get('/getVote', function(req, res, next) {
	var userclass = new UserClass();
	client.getAccessToken(req.query.code, function (err, result) {
		 if(err){
			 res.redirect('/group/fini?title=');
			 
		}else{ 
			 var username = result.data.openid;
			 userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				 if(err){
					 res.send('你还没有加入群呢，快去创建一个吧！');
				 }
				 else{
						var groupObjId = whichGroupNow;
						var query = new AV.Query('Group');
						query.get(groupObjId, {
						  success: function(group) {
							// 成功获得实例
							 //console.log('you get into the '+ group.get('nickname'));
							 var relation = group.relation("feedPosted");
							 relation.targetClassName = 'Feed';
							 var queryFeed = relation.query();
							 queryFeed.descending('createdAt');
							 queryFeed.equalTo("feedType", "vote");
							 queryFeed.find().then(function(votes){
								 res.render('vote', {
									username: username,
									votes:votes
								 });

							 });
							
						  },
						  error: function(object, error) {
							// 失败了.
						  }
						});
				 }
			});
		
	    }
	 });
});
//进行投票
router.post('/vote', function(req, res, next) {
	var username = req.body.username;
	var feedObjId = req.body.feedObjId;
	var choiceId = req.body.choiceId;
	var feedclass = new FeedClass(); 
	//console.log('vote');
	feedclass.set_vote(username,feedObjId,choiceId,function(err,feed,voteResultsWithoutUser){
		if(err)
			res.json({"status":"1","feedObjId":feedObjId,"choiceId":choiceId,"voteResultsWithoutUser":voteResultsWithoutUser});
		else
			res.json({"status":"0","feedObjId":feedObjId,"choiceId":choiceId,"voteResultsWithoutUser":voteResultsWithoutUser});
		return ;
	});
	
});

// 新增 feed
router.post('/post', function(req, res, next) {
  var userclass = new UserClass();
  var feedType = req.body.feedType;
  var feedTitle = req.body.feedTitle;
  var username = req.body.username;
  //username = username.trim();
  //username = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
  var feedclass = new FeedClass(); 
  console.log('feedType'+feedType);
  console.log('feedTitle'+feedTitle);
  console.log('username'+username);
  
  
  userclass.getUserObj(username,function(err,queryUser){ 
	  var groupObjId = queryUser.get('whichGroupNow');
	  if(feedType === 'text'){
		  console.log('into the text post');
		  var feedContent=req.body.feedContent;
		  
		  feedclass.postFeed_text(groupObjId,username,feedContent,function(err,date,feed){
				feed.set('updateTime',date);
				feed.set('feedTitle',feedTitle);
				feed.save();
				res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/feed&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
		   }); 
	  }
	  else if (feedType === 'imgtext'){
			var feedContent=req.body.feedContent;
			var imgurl = req.body.imgurl;
			//console.log('imgurl'+imgurl);
			//console.log('feedContent'+feedContent);
			imgurl = imgurl.split(',');
			//serverId=JSON.parse(serverId).serverId;
			feedclass.postFeed_imgtext(groupObjId,username,feedContent,imgurl,function(err,date,feed){
				feed.set('updateTime',date);
				feed.set('feedTitle',feedTitle);
				feed.save();
				res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/feed&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
		   }); 
	  }
	  else if (feedType === 'vote'){
			var voteDecription = req.body.voteDecription;
			var choiceTitle = req.body.choiceTitle;
			//console.log(choiceTitle);
			var voteContent = new Object();
			var choiceTitleTem = new Array();
			var j =0;
			for(var i=0 ; i < choiceTitle.length ; i++){
					if(choiceTitle[i] != ''){
						choiceTitleTem[j++] = choiceTitle[i];
					}
			
			}
			voteContent={
				"voteContent":{
				"voteDecription":voteDecription,
				"choiceItem": choiceTitleTem
			  }	
			};
			var choiceNum = voteContent.voteContent.choiceItem.length;
			var voteResults = new Object();
			var voteResultsWithoutUser = new Object();
			voteResults = {
					"voteResults":
					{
						"votePeopleNum":0,
						"voteItemContent":
						  {
								"choiceItem":[
								],
								"itemResults":[
								]
						  }
					  }
				  };
			voteResultsWithoutUser = {
				"voteResultsWithoutUser":
				 {
					"votePeopleNum":0,
					"voteItemContent":
					  {
								"choiceItem":[
								]		
					  }
				  }
			};
			var j =0;
			for(var i=0 ; i<choiceNum ; i++){
					voteResults.voteResults.voteItemContent.choiceItem[i] = new Object();
					voteResultsWithoutUser.voteResultsWithoutUser.voteItemContent.choiceItem[i] = new Object();
					voteResults.voteResults.voteItemContent.choiceItem[i].choiceValue=0;
					voteResults.voteResults.voteItemContent.choiceItem[i].percent=0;
					voteResultsWithoutUser.voteResultsWithoutUser.voteItemContent.choiceItem[i].choiceValue = 0;
					voteResultsWithoutUser.voteResultsWithoutUser.voteItemContent.choiceItem[i].percent = 0;
					j++;
					if(j===choiceNum){
						console.log(voteResults);
						feedclass.postFeed_vote(groupObjId,username,voteContent,voteResults,voteResultsWithoutUser,function(err,date,feed){
							feed.set('updateTime',date);
							feed.set('feedTitle',feedTitle);
							feed.save();
							res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/feed/getVote&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
						});
					}
			}
			
	  }
	  else{}
  });
  
  
});
router.post('/setSignIn', function(req, res, next) {
	var username = req.body.username;
	var groupObjId = req.body.groupObjId;
	var userclass = new UserClass();
	console.log(username);
	console.log(groupObjId);
	userclass.getSignInCnt(username,groupObjId,function(err,signIncnt,isSignIn){
		  if(isSignIn=='0'){
				userclass.setSignInCnt(username,groupObjId,function(err,cnt){
				res.json({"status":"1","cnt":cnt});
					return ;
				});
			}
			else{
				res.json({"status":"1","cnt":cnt});
					return ;
			}
	});
	

});
//显示群昵称
router.get('/groupNickname', function(req, res, next) {
	var userclass = new UserClass();
	client.getAccessToken(req.query.code, function (err, result) {
		 if(err){
			 res.redirect('/group/fini?title=');
			 
		}else{ 
			 var username = result.data.openid;
			 userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				 if(err){
					 res.send('你还没有加入群呢，快去创建一个吧！');
				 }
				 else{
						var groupObjId = whichGroupNow;
						username.getGroupNickname(username,whichGroupNow,function(err,nickname){
							console.log('groupnickname',nickname);
						});
						
				 }
			});
		
	    }
	 });
});
router.get('/detail',function(req,res,next){
	 client.getAccessToken(req.query.code, function (err, result){
		 if(err){
			 //res.send('请从微信进入');
			 var username = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
			  var groupObjId = req.query.groupObjId;
		  var feedObjId = req.query.feedObjId;
		  feedObjId ='565ff4a900b0d1dba27abf07';
		  groupObjId = '565edc8a60b25b0435220df8';
			var userclass = new UserClass();
			userclass.isGroupJoined(username,groupObjId,function(status,obj){
					  if(status === 1){
							//res.send('已加入');
							var query = new AV.Query('Feed');
							query.get(feedObjId, {
									success: function(feed) {
										// 成功获得实例
										res.render('lyh_test_feed', {
												username: username,
												groupObjId:groupObjId,
												feedObjId:feedObjId,
												feed:feed
										 });
									},
									error: function(error) {
										// 失败了.
									}
								});
						}	
					  else if (status === 3){
						  res.send('该群已经解散了');
					  }
					  else if (status === 2){
							res.send('你不在这个群里，不能看该状态');
					  }
							
					  else if (status === 0)
							res.send('未关注');
			});
		}else{ 
			var username = result.data.openid;
		  //var groupObjId = req.query.groupObjId; 
		  var feedObjId = req.query.feedObjId;
			var userclass = new UserClass();
			 userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				 if(err){
					 res.send('你还没有加入群呢，快去创建一个吧！');
				 }
				 else{
						var groupObjId = whichGroupNow;
						userclass.isGroupJoined(username,groupObjId,function(status,obj){
							if(status === 1){
								//res.send('已加入');
								var query = new AV.Query('Feed');
								query.get(feedObjId, {
									success: function(feed) {
											// 成功获得实例
											res.render('lyh_test_feed', {
													username: username,
													groupObjId:groupObjId,
													feedObjId:feedObjId,
													feed:feed
											 });
										},
										error: function(error) {
											// 失败了.
										}
								});
							}	
							else if (status === 3){
								res.send('该群已经解散了');
							}
							else if (status === 2){
								res.send('你不在这个群里，不能看该状态');
							}
								
							else if (status === 0)
								res.send('未关注');
					});
						
				 }
			});
			
	    }
	 });

});

module.exports = router;
