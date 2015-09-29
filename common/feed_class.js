var AV = require('leanengine');
var fs = require('fs');
var path= require('path');
//var UserClass = require('./user_class.js');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var WechatAPI = require('wechat-api');
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
function FeedClass()
{
	this.postFeed_text = function(groupObjId,username,feedContent,redirect){
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
				feed.save().then(function(feed){
						redirect();
					});
				
			},
			error:function(error){
				
			}
		});
		
	};
	this.postFeed_imgtext = function(groupObjId,username,feedContent,serverId,cb){
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
										feed.save().then(function(feed){
												cb();
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
	this.postFeed_vote = function(groupObjId,username,cb){
		
	};

};
module.exports = FeedClass;
