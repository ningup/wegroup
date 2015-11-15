var AV = require('leanengine');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var Comment = AV.Object.extend('Comment');

function FeedClass()
{
	this.addComment = function(groupObjId,feedObjId,content,username,toUsername,commentType,isReply,commentImgArray,replyCommentId,cb){
		var comment = new Comment(); 
		comment.set('who',username);
		comment.set('toWhom',toUsername);
		comment.set('content',content);
		comment.set('inWhichFeed',feedObjId);
		comment.set('isReply',isReply);
		comment.set('commentType',commentType);
		comment.set('commentImgArray',commentImgArray);
		comment.set('replyCommentId',replyCommentId);
		comment.save().then(function(comment) {
			//对象保存成功
			var query1 = new AV.Query('UserInfo');
			query1.equalTo("username", username);
			query1.equalTo("groupid", groupObjId);
			query1.first({
			  success: function(userinfo) {
				// 成功获得实例
				comment.set('headimgurl',userinfo.get('headimgurl'));
				comment.set('nickname',userinfo.get('nicknameInGroup'));
				comment.save().then(function(comment){
						var queryF = new AV.Query(Feed);
						queryF.get(feedObjId, {
							success: function(feed) {
								// 成功获得实例
								console.log("found the "+feed.get('feedContent'));
								var date = new Date();
								var relation = feed.relation('feedComment');
								relation.add(comment);
								if(isReply==='0'){
									feed.set('updateTime',date);
								}
								feed.save();
								cb(userinfo.get('nicknameInGroup'),userinfo.get('headimgurl'));
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
