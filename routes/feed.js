var router = require('express').Router();
var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var UserClass = require('../common/user_class.js'); 
var CommentClass = require('../common/comment_class.js');
var fs = require('fs');
var path= require('path');
var OAuth = require('wechat-oauth');
var config = require('../config/config.js');
var client = new OAuth(config.appid, config.appsecret);
var sign=require('../common/sign.js');
//var Group = AV.Object.extend('Group');
//var Feed = AV.Object.extend('Feed');
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

//band list
router.get('/', function(req, res, next) {
	if(req.AV.user){
		// 如果已经登录，发送当前登录用户信息。
		//console.log(AV.User.current());
		var q = new AV.Query(AV.User); 
		var uid = req.AV.user.id;
		q.select("username", "feed_cookies","feed_scroll","loadFeedTime");
		q.get(uid, {success: function(user){
			//console.log(user);
			var limit=20;
			var feedloadsum = user.get('feed_cookies');
			var feed_scroll = user.get('feed_scroll');
			if(feedloadsum > 20){
					limit = feedloadsum;
			}
			//console.log('limit'+limit);
			var username = user.get('username');
			var userclass = new UserClass();
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
				 res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
				}
				else{
					var groupObjId = whichGroupNow;
					var groupNickname = whichGroupNameNow;
					var query = new AV.Query('Group');
					query.get(groupObjId, {
						success: function(group) {
							// 成功获得实例
							//console.log('you get into the '+ group.get('nickname'));
							var relation = group.relation("feedPosted");
							relation.targetClassName = 'Feed';
							var queryFeed = relation.query();
							queryFeed.notEqualTo('feedType','vote');
							queryFeed.notEqualTo('isRemoved',1);
							queryFeed.descending('updateTime');
							queryFeed.limit(limit);
							//queryFeed.equalTo("feedType", "vote");
							queryFeed.find().then(function(feeds){
								userclass.getSignInCnt(username,groupObjId, function(err,cnt,isSignIn){
								var loadFeedTime = new Object();
								if(feeds.length==0){
									loadFeedTime.latest = new Date();
									loadFeedTime.oldest = new Date();
									user.set('loadFeedTime',loadFeedTime);
								}
								else{
									loadFeedTime.latest = feeds[0].get('updateTime');
									loadFeedTime.oldest = feeds[(feeds.length)-1].get('updateTime');
									user.set('loadFeedTime',loadFeedTime);

								}
								user.set('feed_cookies',0);
								user.set('feed_scroll',0);
								user.save();
								res.render('band', {
									username: username,
									groupNickname: groupNickname,
									groupHeadImg:	group.get('groupHeadImg'),
									scroll:feed_scroll,
									feedCnt: group.get('feedCnt'),
									followersNum:group.get('followersNum'),
									groupOwner:group.get('createdBy'),
									groupObjId:groupObjId,
									cnt:cnt,
									isSignIn:isSignIn,
									feeds:feeds
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
		}});
	} 
	else {	// 没有登录，跳转到登录页面。
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup?route=feed&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

//feed history load
router.post('/history', function(req, res, next) {
	var userclass = new UserClass();
	var username = req.body.username;
	var lastFeedId = req.body.lastFeedId;
	userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
		if(err){
			res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
		}
		else{
			var groupObjId = whichGroupNow;
			var query = new AV.Query('Group');
			query.get(groupObjId, {
				success: function(group) {
					// 成功获得实例
					userclass.getUserObj(username,function(err,user){
						var loadFeedTime = user.get('loadFeedTime');
						var relation = group.relation("feedPosted");
						relation.targetClassName = 'Feed';
						var queryFeed = relation.query();
						queryFeed.notEqualTo('feedType','vote');
						queryFeed.notEqualTo('objectId',lastFeedId);
						queryFeed.notEqualTo('isRemoved',1);
						queryFeed.descending('updateTime');
						//queryFeed.lessThanOrEqualTo("updateTime", loadFeedTime.oldest);
						queryFeed.lessThan("updateTime", loadFeedTime.oldest);
						queryFeed.limit(20);
						queryFeed.find().then(function(feeds){
							if(feeds.length != 0){
								loadFeedTime.oldest = feeds[(feeds.length)-1].get('updateTime');
								user.set('loadFeedTime',loadFeedTime);
								//console.log('usersave');
							}
							user.save().then(function(user){
								res.json({"status":"0","feeds":feeds});
								return ;
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
});

router.post('/img', function(req, res, next) {
	var feedObjId = req.body.feedObjId;
	var query = new AV.Query('Feed');
	query.get(feedObjId, {
	  success: function(feed) {
	    // 成功获得实例
	    //console.log("fff");
	    res.json({"status":"0","imgArray":feed.get('feedImgArray')});
			return ;
	  },
	  error: function(error) {
	    // 失败了.
	  }
	});			
});

router.get('/group/member', function(req, res, next) {
	if (req.AV.user) {
		var q = new AV.Query(AV.User); 
		var uid = req.AV.user.id;
		q.select("username");
		q.get(uid, {success: function(user){
			var userclass = new UserClass();
			var username = user.get('username');
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
					res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
				}
				else{
					var groupObjId = whichGroupNow;
					var query = new AV.Query('Group');
					query.get(groupObjId, {
						success: function(group) {
							// 成功获得实例
							var relation = group.relation("followers");
							//relation.targetClassName = 'Feed';
							var queryFollowers = relation.query();
							queryFollowers.find().then(function(users){
								res.render('group_member', {
									users: users,
								});
							});
						},
						error: function(object, error) {
						// 失败了.
						}
					});
				}
			});
	  }});
	}
	else{
		//res.send('我不知道你是谁了，重新进入一下吧');
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}	
});

//显示投票
router.get('/getVote', function(req, res, next) {
	if (req.AV.user) {
		var q = new AV.Query(AV.User); 
		var uid = req.AV.user.id;
		q.select("username");
		q.get(uid, {success: function(user){
			var userclass = new UserClass();
			var username = user.get('username');
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
					res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
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
							queryFeed.limit(20);
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
		}});
	}
	else{
		//res.send('我不知道你是谁了，重新进入一下吧');
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

router.post('/vote/history', function(req, res, next) {
	var userclass = new UserClass();
	var username = req.body.username;
	var skip = req.body.skip;
	userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
		if(err){
		 res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
		}
		else{
			var groupObjId = whichGroupNow;
			var query = new AV.Query('Group');
			query.get(groupObjId, {
				success: function(group) {
					// 成功获得实例
					var relation = group.relation("feedPosted");
					relation.targetClassName = 'Feed';
					var queryFeed = relation.query();
					queryFeed.equalTo('feedType','vote');
					queryFeed.notEqualTo('isRemoved',1);
					queryFeed.descending('updateTime');
					queryFeed.skip(skip);
					queryFeed.limit(10);
					queryFeed.find().then(function(votes){
						res.json({"status":"0","votes":votes});
						return ;			
					});
				},
				error: function(object, error) {
				// 失败了.
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
	feedclass.set_vote(username,feedObjId,choiceId,function(err,feed,voteResultsWithoutUser,voteCnt){
		if(err)
			res.json({"status":"1","feedObjId":feedObjId,"choiceId":choiceId,"voteResultsWithoutUser":voteResultsWithoutUser,"voteCnt":voteCnt});
		else
			res.json({"status":"0","feedObjId":feedObjId,"choiceId":choiceId,"voteResultsWithoutUser":voteResultsWithoutUser,"voteCnt":voteCnt});
		return ;
	});	
});

// 新增 feed
router.post('/post', function(req, res, next) {
  var userclass = new UserClass();
  var feedType = req.body.feedType;
  var feedTitle = req.body.feedTitle;
  var username = req.body.username;
  var feedclass = new FeedClass(); 
  userclass.getUserObj(username,function(err,queryUser){ 
	  var groupObjId = queryUser.get('whichGroupNow');
	  if(feedType === 'text'){
		  var feedContent=req.body.feedContent;
		  feedclass.postFeed_text(groupObjId,username,feedContent,function(err,date,feed){
				feed.set('updateTime',date);
				feed.set('feedTitle',feedTitle);
				feed.save();
				res.redirect("/feed");
		   }); 
	  }
	  else if (feedType === 'imgtext'){
			var feedContent=req.body.feedContent;
			var imgurl = req.body.imgurl;
			imgurl = imgurl.split(',');
			feedclass.postFeed_imgtext(groupObjId,username,feedContent,imgurl,function(err,date,feed){
				feed.set('updateTime',date);
				feed.set('feedTitle',feedTitle);
				feed.save();
				res.redirect("/feed");
		   }); 
	  }
	  else if (feedType === 'vote'){
			var voteDecription = req.body.voteDecription;
			var choiceTitle = req.body.choiceTitle;
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
						res.redirect("/feed/getVote");
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
		}
		else{ 
			var username = result.data.openid;
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
				  res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
				}
				else{
					var groupObjId = whichGroupNow;
					username.getGroupNickname(username,whichGroupNow,function(err,nickname){
						//console.log('groupnickname',nickname);
					});
				}
			});
	  }
	});
});

router.get('/detail',function(req,res,next){
	var feedObjId = req.query.feedObjId;
	var cookies_feeds_load = req.query.feedSum;
	var cookies_feeds_scroll = req.query.scroll;
	if (req.AV.user) {
		var q = new AV.Query(AV.User); 
		var uid = req.AV.user.id;
		q.select("username", "feed_cookies","feed_scroll");
		q.get(uid, {success: function(user){
			var username = user.get('username');
			var userclass = new UserClass();
			var commentclass = new CommentClass();
			var likeclass = new LikeClass();
			user.set('feed_cookies',parseInt(cookies_feeds_load));
			user.set('feed_scroll',parseInt(cookies_feeds_scroll));
			user.save();
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
					res.redirect('/group/fini?title=你还没有加入群呢，快去创建一个吧！');
				}
				else{
					var groupObjId = whichGroupNow;
					var groupNickname = whichGroupNameNow;
					userclass.isGroupJoined(username,groupObjId,function(status,obj){
						if(status === 1){
							//res.send('已加入');
							var query = new AV.Query('Feed');
							query.get(feedObjId, {
								success: function(feed) {
									// 成功获得实例
									var visitCnt = feed.get('visitCnt');
									visitCnt +=1;
									feed.set('visitCnt',visitCnt);
									feed.save();
									commentclass.getCommentInFeedDetail(feedObjId,0,function(err,havecomment,commentJson){
										likeclass.isLike(feed,username,function(islike){
											res.render('lyh_test_feed', {
												username: username,
												groupObjId:groupObjId,
												feedObjId:feedObjId,
												groupNickname:groupNickname,
												feed:feed,
												islike:islike,
												havecomment:havecomment,
												commentJson:commentJson
											});	
										});
									});
								},
								error: function(error) {
									// 失败了.
								}
							});
						}	
						else if (status === 3){
							res.redirect('/group/fini?title=该群已经解散了');
						}
						else if (status === 2){
							res.redirect('/group/fini?title=你不在这个群里，不能看该状态');
						}
						else if (status === 0)
							res.render('guide');
					});
				}
			});
		}});
	}
	else{
		//res.send('我不知道你是谁了，重新进入一下吧');
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

router.post('/detail/comment_more',function(req,res,next){
	var feedObjId = req.body.feedObjId;
	var username = req.body.username;
	var skip = req.body.skip;
	var userclass = new UserClass();
	var commentclass = new CommentClass();
	//console.log('skip..'+skip+'\n'+'username'+username);
	userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
		if(err){
			res.json({"err":'1',"msg":'没有加入群，去创建一个吧'});
			return;
		}
		else{
			var groupObjId = whichGroupNow;
			var groupNickname = whichGroupNameNow;
			userclass.isGroupJoined(username,groupObjId,function(status,obj){
				if(status === 1){
					//res.send('已加入');
					var query = new AV.Query('Feed');
					query.get(feedObjId, {
						success: function(feed) {
								// 成功获得实例
							commentclass.getCommentInFeedDetail(feedObjId,skip,function(err,havecomment,commentJson){
								res.json({"err":'0',"feedObjId":feedObjId,"commentJson":commentJson,"havecomment":havecomment});
								return;
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
});

router.post('/remove',function(req,res,next){
	var feedObjId = req.body.feedObjId;
	var username = req.body.username;
	var userclass = new UserClass();
	var feedclass = new FeedClass();
	userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
		if(err){
			res.json({"err":'1',"msg":'没有加入群，去创建一个吧'});
			return;
		}
		else{
			var groupObjId = whichGroupNow;
			var groupNickname = whichGroupNameNow;
			feedclass.remove_feed(feedObjId,groupObjId,function(){
				res.redirect('/feed');
			});
		}
	});
});

module.exports = router;
