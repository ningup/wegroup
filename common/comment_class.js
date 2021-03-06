var AV = require('leanengine');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
var Comment = AV.Object.extend('Comment');
var UserClass = require('./user_class.js'); 
function FeedClass()
{
	this.addComment = function(groupObjId,feedObjId,content,username,toUsername,commentType,isReply,commentImgArray,replyCommentId,inWhichComment,cb){
		var userclass = new UserClass();
		var comment = new Comment(); 
		comment.set('who',username);
		comment.set('toWhom',toUsername);
		comment.set('content',content);
		comment.set('inWhichFeed',feedObjId);
		comment.set('inWhichGroup',groupObjId);
		comment.set('isReply',isReply);
		comment.set('commentType',commentType);
		comment.set('commentImgArray',commentImgArray);
		comment.set('replyCommentId',replyCommentId);
		comment.set('inWhichComment',inWhichComment);
		comment.save().then(function(comment) {
			//对象保存成功
			var query1 = new AV.Query('UserInfo');
			query1.equalTo("username", username);
			query1.equalTo("groupid", groupObjId);
			query1.first({
			  success: function(userinfo) {
				// 成功获得实例
				userclass.getGroupNickname(toUsername,groupObjId,function(err,toNickname){
					//console.log('comment find userinfo');
					comment.set('headimgurl',userinfo.get('headimgurl'));
					comment.set('nickname',userinfo.get('nicknameInGroup'));
					comment.set('toNickname',toNickname);
					comment.save().then(function(comment){
							var queryF = new AV.Query(Feed);
							queryF.get(feedObjId, {
								success: function(feed) {
									// 成功获得实例
									//console.log("found the feed content"+feed.get('feedContent'));
									var date = new Date();
									var relation = feed.relation('feedComment');
									relation.add(comment);
									if(isReply==='0'){
										var commentCnt = feed.get('commentCnt');
										commentCnt += 1;
										feed.set('commentCnt',commentCnt);
										feed.set('updateTime',date);
									}
									else{
										var queryC = new AV.Query(Comment);
										queryC.get(inWhichComment,{
											success: function(c){
												var replyCnt = c.get('replyCnt');
												replyCnt += 1;
												c.set('replyCnt',replyCnt);
												c.save();
											},
											error:function(c,error){}
										});
									}
									feed.save();
									cb(comment,userinfo.get('nicknameInGroup'),userinfo.get('headimgurl'),userinfo.get('groupName'));
								},
								error: function(feed, error) {
									// 失败了.
								}
							});
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
	
	this.getCommentInFeedDetail = function(feedObjId,skip,cb){
		var commentJson = new Object();
		commentJson.comments = new Array();
		var query = new AV.Query('Comment');
		query.ascending('createdAt');
		query.equalTo('isReply','0');
		query.equalTo('isRemoved',0);
		query.equalTo('inWhichFeed',feedObjId);
		query.skip(skip);
		query.limit(20);
		query.find({
			success: function(comments) {
				// 成功了
				//console.log(comments.length);
				if(comments.length == 0)
						cb(null,'0',commentJson);
				else{
					//console.log(comment);
					var cnti = 0;
					var lenc = comments.length;
					for(var i = 0; i < comments.length ; i++){
						(function(i){
							commentJson.comments[i] = new Object();
							commentJson.comments[i].id = comments[i].getObjectId();
							commentJson.comments[i].headimgurl = comments[i].get('headimgurl');
							commentJson.comments[i].replyCnt = comments[i].get('replyCnt');
							commentJson.comments[i].nickname = comments[i].get('nickname');
							commentJson.comments[i].toWhom = comments[i].get('who');
							commentJson.comments[i].content = comments[i].get('content');
							commentJson.comments[i].imgArray = new Array();
							commentJson.comments[i].imgArray=comments[i].get('commentImgArray');
							commentJson.comments[i].time = comments[i].getCreatedAt();
							commentJson.comments[i].reply = new Object();
							commentJson.comments[i].reply.moreReply = '0';
							commentJson.comments[i].reply.reply = new Array();
							var queryR = new AV.Query('Comment');
							queryR.ascending('createdAt');
							queryR.equalTo('isReply','1');
							queryR.equalTo('isRemoved',0);
							queryR.equalTo('inWhichComment',commentJson.comments[i].id);
							queryR.limit(3);
							queryR.find({
								success: function(replyComments) {
									var len = replyComments.length;
									if (replyComments.length >2){
										var len = 2;
										//console.log('len'+len);
										commentJson.comments[i].reply.moreReply = '1';
									}
									var cntj =0;
									if(len ==0){
										cnti++;
										//console.log(i);
										if(cnti == lenc){
												cb(null,'1',commentJson);
										}
									}else{
										for (var j = 0; j < len; j++) {
										commentJson.comments[i].reply.reply[j] = new Object();
										commentJson.comments[i].reply.reply[j].id = replyComments[j].getObjectId();
										commentJson.comments[i].reply.reply[j].nickname = replyComments[j].get('nickname');
										commentJson.comments[i].reply.reply[j].toNickname = replyComments[j].get('toNickname');
										commentJson.comments[i].reply.reply[j].content = replyComments[j].get('content');
										commentJson.comments[i].reply.reply[j].replyCommentId= replyComments[j].get('replyCommentId');
										commentJson.comments[i].reply.reply[j].who= replyComments[j].get('who');
										commentJson.comments[i].reply.reply[j].time = replyComments[j].getCreatedAt();
										cntj ++;
										if(cntj == len){
											cnti++;
											//console.log(i);
											if(cnti == lenc){
												cb(null,'1',commentJson);
											}
										}

									}	
								} 

								},
								error: function(error) {
									//alert("Error: " + error.code + " " + error.message);
								}
							});

						})(i);
					}
				}

			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
		});		
	};
	
	this.rmComment = function(commentObjId,cb){
		var query = new AV.Query('Comment');
		query.get(commentObjId, {
			success: function(comment) {
				// 成功获得实例
				if(comment.get('isReply')=='0'){
					var queryf = new AV.Query('Feed');
					queryf.get(comment.get('inWhichFeed'), {
						success: function(feed) {
							var commentCnt = feed.get('commentCnt');
							if(commentCnt >= 1)
								commentCnt -= 1;
							feed.set('commentCnt',commentCnt);
							feed.save();
							comment.set('isRemoved',1);
							comment.save().then(function(c){
								cb('1');
							});
						},
						error: function(error) {
							// 失败了.
						}
					});
				}
				else{
					var queryc = new AV.Query('Comment');
					queryc.get(comment.get('inWhichComment'), {
						success: function(C) {
							var replyCnt = C.get('replyCnt');
							if(replyCnt >= 1)
								replyCnt -= 1;
							C.set('replyCnt',replyCnt);
							C.save();
							comment.set('isRemoved',1);
							comment.save().then(function(c){
								cb('0');
							});
						},
						error: function(error) {
							// 失败了.
						}
					});
				}

			},
			error: function(error) {
				// 失败了.
			}
		});	
	};

};
module.exports = FeedClass;
