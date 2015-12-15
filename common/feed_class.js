var AV = require('leanengine');
var fs = require('fs');
var path= require('path');
//var UserClass = require('./user_class.js');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var WechatAPI = require('wechat-api');
var config = require('../config/config.js');
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
function FeedClass()
{
	this.postFeed_text = function(groupObjId,username,feedContent,cb){
		var feed=new Feed();
		feed.set('postedBy',username);
		feed.set('feedType','text');
		feed.set('feedContent',feedContent);
		feed.set('inWhichGroup',groupObjId);
		feed.save().then(function(feed) {
			//对象保存成功
			var queryG = new AV.Query(Group);
		queryG.get(groupObjId, {
		success: function(group) {
			// 成功获得实例
			var feedCnt = group.get('feedCnt');
			feedCnt += 1;
			group.set('feedCnt',feedCnt);
			console.log("found the "+group.get('nickname'));
			var relation = group.relation('feedPosted');
            relation.add(feed);
            group.save();
		},
		error: function(feed, error) {
			// 失败了.
		}
		});
			
		}, function(error) {
			//对象保存失败，处理 error
		});
		var queryUser = new AV.Query(AV.User);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				feed.set('nicknameOfPUser',queryUser.get('nickname'));
				feed.set('userHeadImgUrl',queryUser.get('headimgurl'));
				feed.save().then(function(feed){
						cb(null,feed.getCreatedAt(),feed);
					});
				
			},
			error:function(error){
				
			}
		});
		
	};
	this.postFeed_imgtext = function(groupObjId,username,feedContent,imgurl,cb){
			var feed=new Feed();
			feed.set('postedBy',username);
			feed.set('feedType','imgtext');
			feed.set('feedContent',feedContent);
			feed.set('inWhichGroup',groupObjId);
			feed.set('feedImgArray',imgurl);
			//feed.set('feedImgArraySmall',feedImg_small);
			feed.save().then(function(feed) {
				//对象保存成功
				var queryG = new AV.Query(Group);
				queryG.get(groupObjId, {
				success: function(group) {
					// 成功获得实例
					var feedCnt = group.get('feedCnt');
					feedCnt += 1;
					group.set('feedCnt',feedCnt);
					console.log("found the "+group.get('nickname'));
					var relation = group.relation('feedPosted');
					relation.add(feed);
					group.save();
				},
				error: function(feed, error) {
					// 失败了.
				}
				});
				
			}, function(error) {
				//对象保存失败，处理 error
			});
			var queryUser = new AV.Query(AV.User);
			queryUser.equalTo("username",username);
			queryUser.first({
			success:function(queryUser){
					feed.set('nicknameOfPUser',queryUser.get('nickname'));
					feed.set('userHeadImgUrl',queryUser.get('headimgurl'));
					feed.save().then(function(feed){
							cb(null,feed.getCreatedAt(),feed);
						});
					
				},
				error:function(error){
					
				}
			});
		
	};
	this.postFeed_imgtext_wechatApi = function(groupObjId,username,feedContent,serverId,cb){
		var feedImgFile = new Array();
		var feedImg = new Array();
		var feedImg_small = new Array();
		//var imgData = new Array();
		var j=0;
		var count =0;
		//var reQueryGroup = new Array();
        for(var i=0 ; i< serverId.length;i++){
			(function(i){
				count = i+1;
				api.getLatestToken(function(){
				});
				api.getMedia(serverId[i], function (err, imgData, res) {
							var feedimgfile = new AV.File('test.jpg', imgData);  //,res.headers['content-type']);
							feedimgfile.save().then(function(feedimgfile){
							feedImg[i] = feedimgfile.url();
							feedImg_small[i]=feedimgfile.thumbnailURL(640,480);
							j++;
							if(j===serverId.length)
							{
								//cb(null,feedImg);
								var feed=new Feed();
								feed.set('postedBy',username);
								feed.set('feedType','imgtext');
								feed.set('feedContent',feedContent);
								feed.set('inWhichGroup',groupObjId);
								feed.set('feedImgArray',feedImg);
								feed.set('feedImgArraySmall',feedImg_small);
								feed.save().then(function(feed) {
									//对象保存成功
									var queryG = new AV.Query(Group);
									queryG.get(groupObjId, {
									success: function(group) {
										// 成功获得实例
										console.log("found the "+group.get('nickname'));
										var relation = group.relation('feedPosted');
										relation.add(feed);
										group.save();
									},
									error: function(feed, error) {
										// 失败了.
									}
									});
									
								}, function(error) {
									//对象保存失败，处理 error
								});
								var queryUser = new AV.Query(AV.User);
								queryUser.equalTo("username",username);
								queryUser.first({
								success:function(queryUser){
										feed.set('nicknameOfPUser',queryUser.get('nickname'));
										feed.set('userHeadImgUrl',queryUser.get('headimgurl'));
										feed.save().then(function(feed){
												cb(null,feed.getCreatedAt(),feed);
											});
										
									},
									error:function(error){
										
									}
								});
							}
						});

				});
				
		   })(i);
	     }
		
		
	};
	this.postFeed_vote = function(groupObjId,username,voteContent,voteResults,voteResultsWithoutUser,cb){
		var feed=new Feed();
		feed.set('postedBy',username);
		feed.set('feedType','vote');
		feed.set('voteContent',voteContent);
		feed.set('voteResults',voteResults);
		feed.set('voteResultsWithoutUser',voteResultsWithoutUser);
		feed.set('inWhichGroup',groupObjId);
		feed.save().then(function(feed) {
			//对象保存成功
		var queryG = new AV.Query(Group);
		queryG.get(groupObjId, {
		 success: function(group) {
			// 成功获得实例
			console.log("found the "+group.get('nickname'));
			var relation = group.relation('feedPosted');
            relation.add(feed);
            group.save();
		 },
		 error: function(feed, error) {
			// 失败了.
		 }
		});
			
		}, function(error) {
			//对象保存失败，处理 error
		});
		var queryUser = new AV.Query(AV.User);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				feed.set('nicknameOfPUser',queryUser.get('nickname'));
				feed.set('userHeadImgUrl',queryUser.get('headimgurl'));
				feed.save().then(function(feed){
						cb(null,feed.getCreatedAt(),feed);
					});
				
			},
			error:function(error){
				
			}
		});
	};
	this.set_vote = function(username,feedObjId,choiceId,cb){
		var query = new AV.Query(Feed);
		console.log(feedObjId);
		query.get(feedObjId, {
  		success: function(feed) {
    		// 成功获得实例
				var voteCnt = feed.get('voteCnt');
    		var voteResults = feed.get('voteResults');
    		var voteResultsWithoutUser = feed.get('voteResultsWithoutUser');
    		var userArray = voteResults.voteResults.voteItemContent.itemResults;
    		var l = userArray.length;
    		var isVoted = 0;
    		//for(var i = 0 ; i < l ; i++){				//防止同一个用户 投票多次
				//if(userArray[i].username === username){
					//isVoted = 1;
					//break;
				//}
				
			//}
			if(isVoted ===1){
				cb(1,feed,voteResultsWithoutUser,voteCnt);
			}
			else{
				voteResults.voteResults.voteItemContent.choiceItem[choiceId].choiceValue +=1;
				voteResultsWithoutUser.voteResultsWithoutUser.voteItemContent.choiceItem[choiceId].choiceValue +=1;
				voteResults.voteResults.votePeopleNum += 1;
				voteResultsWithoutUser.voteResultsWithoutUser.votePeopleNum +=1;
				for(var i=0 ; i< voteResults.voteResults.voteItemContent.choiceItem.length ;i++){
					voteResults.voteResults.voteItemContent.choiceItem[i].percent = Math.round(100*(voteResults.voteResults.voteItemContent.choiceItem[i].choiceValue/voteResults.voteResults.votePeopleNum));
					voteResultsWithoutUser.voteResultsWithoutUser.voteItemContent.choiceItem[i].percent = Math.round(100*(voteResultsWithoutUser.voteResultsWithoutUser.voteItemContent.choiceItem[i].choiceValue/voteResultsWithoutUser.voteResultsWithoutUser.votePeopleNum));
				}
				var num = voteResults.voteResults.voteItemContent.itemResults.length;
				voteResults.voteResults.voteItemContent.itemResults[num] = new Object();
				voteResults.voteResults.voteItemContent.itemResults[num].username = username;
				voteResults.voteResults.voteItemContent.itemResults[num].choice = choiceId;
				voteCnt += 1;
				feed.set('voteCnt',voteCnt);
				feed.set('voteResults',voteResults);
				feed.set('voteResultsWithoutUser',voteResultsWithoutUser);
				feed.save().then(function(feed){
						cb(null,feed,voteResultsWithoutUser,voteCnt);
				});
				
			}
    		
    		
  		},
  		error: function(object, error) {
    		// 失败了.
  		}
      });
	};
	
	this.remove_feed = function(feedObjId,groupObjId,cb){
		var query = new AV.Query('Group');
		query.get(groupObjId, {
			success: function(group) {
				// 成功获得实例
				var relation = group.relation('feedPosted');
				var feedCnt = group.get('feedCnt');
				var queryf = new AV.Query('Feed');
				queryf.get(feedObjId, {
					success: function(feed) {
						relation.remove(feed);
						if(feedCnt >= 1)
							feedCnt -= 1;
						group.set('feedCnt',feedCnt);
						feed.set('isRemoved',1);
						feed.save();
						group.save().then(function(g){
							cb();
						});
					},
					error: function(error) {
						// 失败了.
					}
				});
			},
			error: function(error) {
				// 失败了.
			}
		});
	};

};
module.exports = FeedClass;
