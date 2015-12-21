var AV = require('leanengine');
var Group=AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');

function LikeClass()
{
	this.like = function(feedObjId,username,cb){
		var queryFeed=new AV.Query(Feed);
		queryFeed.get(feedObjId,{
				success: function(feed){
					var like_cnt=-1;
					like_cnt = feed.get('likeNum');
					if(like_cnt < 0){
						console.log('获取当前点赞数失败');
				    }else{
						/*like_cnt += 1;
						feed.set('likeNum',like_cnt);*/
						var relation = feed.relation("likeUsers");
						var queryUser = relation.query();
						queryUser.equalTo("username",username);
						queryUser.first({
							success:function(queryUser){
								if(queryUser != null){
									like_cnt += 1;
									feed.set('likeNum',like_cnt);
									console.log('like user'+queryUser.get('nickname'));
									//var relation = feed.relation('likeUsers');
									relation.add(queryUser);
									feed.save().then(function(feedObj){
											cb(null,feedObj);
									});
								}
								else
									cb(1,feedObj);
				
							},
							error:function(error){
									cb(1,feedObj);
							}
						});
						
					}
					
				},
				error: function(feed,error){
					
			    }
		});
		
	};
	this.unlike = function(feedObjId,username){
		var queryFeed=new AV.Query(Feed);
		queryFeed.get(feedObjId,{
				success: function(feed){
					var like_cnt=-1;
					like_cnt = feed.get('likeNum');
					if(like_cnt < 0){
						console.log('获取当前点赞数失败');
				  }
					else if(like_cnt == 0){}
					else {
						like_cnt -= 1;
						feed.set('likeNum',like_cnt);
						var queryUser = new AV.Query(AV.User);
						queryUser.equalTo("username",username);
						queryUser.first({
							success:function(queryUser){
								//console.log('like user'+queryUser.get('nickname'));
								var relation = feed.relation('likeUsers');
								relation.remove(queryUser);
								feed.save().then(function(feedObj){
										cb(null,feedObj);
								});
								
				
							},
							error:function(error){
				
							}
						});
						
					}
					
				},
				error: function(feed,error){
					
			    }
		});
	};
	
	this.isLike = function(feed,username,cb){
			var relation = feed.relation("likeUsers");
			var queryUser = relation.query();
			queryUser.equalTo("username",username);
			queryUser.first({
				success:function(queryUser){
					if(queryUser != null){
						cb(1);
					}
					else
						cb(0);

				},
				error:function(error){
						cb(0);
				}
			});
	};

};

module.exports = LikeClass;
