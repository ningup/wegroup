var AV = require('leanengine');
var fs = require('fs');
var path= require('path');
//var UserClass = require('./user_class.js');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');

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
		var imgData = new Array();
		var j=0;
		var count =0;
		//var reQueryGroup = new Array();
        for(var i=0 ; i< 9;i++){
			(function(i){
				count = i+1;
				fs.readFile('/home/ning/Desktop/img/'+count+'.jpg', function(err,imgData){ 
					 if(err){ 	
					  console.log(err); 
					 }else{ 
							var feedimgfile = new AV.File('test.jpg', imgData);  //,res.headers['content-type']);
							feedimgfile.save().then(function(feedimgfile){
							feedImg[i] = feedimgfile;
							j++;
							if(j===9)
							{
								//cb(null,feedImg);
								var feed=new Feed();
								feed.set('postedBy',username);
								feed.set('feedType','imgtext');
								feed.set('feedContent',feedContent);
								feed.set('inWhichGroup',groupObjId);
								feed.set('feedImgArray',feedImg);
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
						
						
					 } 
				});
				
		   })(i);
	     }
		
		
	};

};
module.exports = FeedClass;
