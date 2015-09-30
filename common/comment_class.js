var AV = require('leanengine');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var Comment = AV.Object.extend('Comment');

function FeedClass()
{
	this.addComment = function(feedObjId,content,username,toUsername,cb){
		var comment = new Comment(); 
		comment.set('who',username);
		comment.set('toWhom',toUsername);
		comment.set('content',content);
		comment.set('inWhichFeed',feedObjId);
		comment.save().then(function(comment) {
			//对象保存成功
			var queryUser = new AV.Query(AV,User);
			queryUser.get(username, {
			  success: function(user) {
				// 成功获得实例
				comment.set('headimgurl',user.get('headimgurl'));
				comment.set('nickname',user.get('nickname'));
				comment.save().then(function(comment){
						var queryF = new AV.Query(Feed);
						queryF.get(feedObjId, {
							success: function(feed) {
								// 成功获得实例
								console.log("found the "+feed.get('feedContent'));
								var relation = feed.relation('feedComment');
								relation.add(comment);
								feed.save();
								cb(user.get('nickname'),user.get('headimgurl'));
							},
							error: function(feed, error) {
								// 失败了.
							}
						});
				});
			  },
			  error: function(object, error) {
				// 失败了.
			  }
			});
			
		}, function(error) {
		//对象保存失败，处理 error
		});
	
	};
	this.rmComment = function(commentObjId){
		
	};

};
module.exports = FeedClass;
