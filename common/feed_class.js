var AV = require('leanengine');
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
	this.postFeed_imgtext = function(groupName,username){
		
	};

};
module.exports = FeedClass;
