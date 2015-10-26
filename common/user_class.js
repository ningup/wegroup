var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var fs = require('fs');
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
var Group = AV.Object.extend('Group');
function userFollowed()
{
    
    this.followedUserRegister = function(){
	  var count;
      api.getFollowers(function (err, dataF, resf){
        count = dataF.count;
        console.log('count'+count);	
        var openids = dataF.data.openid;
	    for(var i=0 ; i < count ; i++){
			(function(i){
				     //console.log("datalist"+datalist.user_info_list.length);	     
					 var newUser = new AV.User();
					 api.getUser({openid:openids[i], lang: 'zh_CN'}, function (err, data, userres){
									var newUser = new AV.User();
									newUser.set("username", data.openid);
									newUser.set("password", "A00000000~");
									newUser.set("openid", data.openid);
									newUser.set("nickname", data.nickname);
									newUser.set("sex", data.sex);
									newUser.set("headimgurl", data.headimgurl);
									newUser.set("subscribe", 1);
									newUser.set("country", data.country);
									newUser.set("province", data.province);
									newUser.set("city", data.city);
									newUser.signUp(null, {
									   success: function(newUser) {
											// 注册成功，可以使用了.
											 
									   },
									   error: function(newUser, error) {
										
										}
									});

					});	
				
			})(i);
	     

          }
                            
     
      });
    }
    this.config_lastAccessTime = function(username){
		var lastAccessTime = new Object();
		lastAccessTime.time = new Array();
		var queryUser = new AV.Query(AV.User);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				console.log('find user'+ queryUser.get('nickname'));
				var relation = queryUser.relation("groupCreated");
				relation.targetClassName = 'Group';
				var query = relation.query();
				//query.equalTo('nickname','北交大');
				query.find({
				  success: function(results) {
					  var i = 0;
					  var j=0;
					for (i = 0; i < results.length; i++) {
					  var object = results[i];
					  console.log('find relation group:'+ object.get('nickname')+ '创建者是:' +object.get('nicknameOfCUser'));
						lastAccessTime.time[i] = new Object() ;
						lastAccessTime.time[i].gid = object.getObjectId();
						lastAccessTime.time[i].time = object.getCreatedAt();
						j++;
					}
					var relationJ = queryUser.relation("groupJoined");
					relationJ.targetClassName = 'Group';
					var queryJ = relationJ.query();
					queryJ.find({
					  success: function(resultsJ) {
						for (i = 0; i < resultsJ.length; i++) {
						  var objectJ = resultsJ[i];
						  console.log('find relation group:'+ objectJ.get('nickname')+ '创建者是:' +objectJ.get('nicknameOfCUser'));
							lastAccessTime.time[j] = new Object() ;
							lastAccessTime.time[j].gid = objectJ.getObjectId();
							lastAccessTime.time[j].time = objectJ.getCreatedAt();
							j++;
							if(j===(resultsJ.length+results.length))
							{
								console.log(lastAccessTime);
								queryUser.set('lastAccessTime',lastAccessTime);
								queryUser.save();
							}
							
						}
						}});
					
					
				  },
				  error: function(error) {	
				  }
				});
				
				
				
			},
			error:function(error){
				
			}
		});

	}; 
	this.getUserAllGroup = function(username,cb){
		var queryUser = new AV.Query(AV.User);
		//console.log('username'+username);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				console.log('find '+ queryUser.get('nickname'));
				var relation = queryUser.relation("groupCreated");
				relation.targetClassName = 'Group';
				var query = relation.query();
				//query.equalTo('nickname','北交大');
				query.find({
				  success: function(results) {
					  var i = 0;
					  var j=0;
					for (i = 0; i < results.length; i++) {
					  var object = results[i];
					  console.log('find relation group:'+ object.get('nickname')+ '创建者是:' +object.get('nicknameOfCUser'));
						j++;
					}
					var relationJ = queryUser.relation("groupJoined");
					relationJ.targetClassName = 'Group';
					var queryJ = relationJ.query();
					queryJ.find({
					  success: function(resultsJ) {
						for (i = 0; i < resultsJ.length; i++) {
						  var objectJ = resultsJ[i];
						  results[j] = objectJ
						  console.log('find relation group:'+ objectJ.get('nickname')+ '创建者是:' +objectJ.get('nicknameOfCUser'));
							j++;					
						}
						cb(null, results);

	
						}});
		
				  },
				  error: function(error) {	
				  }
				});
		
				
			},
			error:function(error){
				
			}
		});
	};
	this.signUp = function(username,cb){
		 api.getUser({openid:username, lang: 'zh_CN'}, function (err, data, userres){
				var newUser = new AV.User();
				newUser.set("username", data.openid);
				newUser.set("password", "A00000000~");
				newUser.set("openid", data.openid);
				newUser.set("nickname", data.nickname);
				newUser.set("sex", data.sex);
				newUser.set("headimgurl", data.headimgurl);
				newUser.set("subscribe", 1);
				newUser.set("country", data.country);
				newUser.set("province", data.province);
				newUser.set("city", data.city);
				newUser.signUp(null, {
				   success: function(newUser) {
						// 注册成功，可以使用了.
						  cb(0,newUser);
						  
				   },
				   error: function(newUser, error) {
						var query = new AV.Query(AV.User);
						query.equalTo("username", username);
						query.first({
							success: function(queryUser) {
									queryUser.set('subscribe', 1 );
									queryUser.save();
									cb(1,queryUser);
									
							},
							error: function(error) {
							} 
						});
					}
				});

		});	
	};
	this.getCurrentGroup = function(username,cb){
		var query = new AV.Query(AV.User);
		query.equalTo("username", username);
		query.first({
			success: function(queryUser) {
				var whichGroupNow = queryUser.get('whichGroupNow');
				console.log('whichGroupNow:'+whichGroupNow);
				if(whichGroupNow != '0'){
					var whichGroupNameNow = queryUser.get('whichGroupNameNow');
				    cb(0,whichGroupNow,whichGroupNameNow);
				}else{
					cb(1,null,null);
			    }
					
			},
			error: function(error) {
			} 
		});
	};
	this.getUserObj = function(username,cb){
		var query = new AV.Query(AV.User);
		query.equalTo("username", username);
		query.first({
			success: function(queryUser) {
				cb(null,queryUser);
			},
			error: function(error) {
			} 
		});
	
	};
	this.isGroupJoined = function(username,groupObjId,cb){
		var queryUser = new AV.Query(AV.User);
		var status = 1; //1 joined  2 isnot joined 0 unsubscribe 
		//console.log('username'+username);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				if(queryUser.get('subscribe')===0){
					status = 0;
					cb(status,null);
				}
				else{
					console.log('find '+ queryUser.get('nickname'));
					var relation = queryUser.relation("groupCreated");
					relation.targetClassName = 'Group';
					var query = relation.query();
					query.equalTo('objectId',groupObjId);
					query.find({
					  success: function(results) {
							console.log('find relation group:'+ results.length);
							if(results.length != 0)
								cb(status,results);
							else{
								var relationJ = queryUser.relation("groupJoined");
								relationJ.targetClassName = 'Group';
								var queryJ = relationJ.query();
								queryJ.equalTo('objectId',groupObjId);
								queryJ.find({
								  success: function(resultsJ) {
										if(resultsJ.length != 0)
											cb(status,resultsJ);
										else{
											status = 2;   //isnot joined
											cb(status,null);
										}
									},
									error: function(error) {	
										
									}
								 });
						
							}
					  },
					  error: function(error) {	

					  }
					});	
				}

			},
			error:function(error){

			}
		});
	};
	this.groupChat_text = function(username,groupid,text,cb){
		var query = new AV.Query(AV.User);
		query.equalTo("username", username);
		query.first({
			success: function(queryUser){
				console.log('find '+ queryUser.get('nickname'));
				var queryG = new AV.Query(Group);
				queryG.get(groupid,{
					success: function(group) {
						console.log('find '+ group.get('nickname'));
						var relation = group.relation("followers");
						//relation.targetClassName = 'AV.User';
						var query = relation.query();
						//query.equalTo('objectId',groupObjId);
						query.find({
						  success: function(results) {
							// 处理返回的结果数据
							for (var i = 0; i < results.length; i++) {
							  (function(i){
								    var object = results[i];
								    console.log('find obj'+ object.get('nickname'));
									if(object.get('whichGroupNow')===groupid){
										api.sendText(object.get('username'), queryUser.get('nickname')+'说：'+text, function(err,results){
											  cb();
											  if(err){
												api.sendText(object.get('username'), queryUser.get('nickname')+'说：'+text, function(err,results){
												});	
											 }
										});	
									}
								  
							   })(i);
							
							}
						  },
						  error: function(error) {
							//alert("Error: " + error.code + " " + error.message);
						  }
						});
						
					},
					error: function(object, error) {
					  
					}
				});
				
			},
			error: function(error) {
			} 
		});
	
	};
	this.groupChat_media = function(username,groupid,MediaId,type,cb){
		var query = new AV.Query(AV.User);
		query.equalTo("username", username);
		query.first({
			success: function(queryUser){
				console.log('find '+ queryUser.get('nickname'));
				var queryG = new AV.Query(Group);
				queryG.get(groupid,{
					success: function(group) {
						console.log('find '+ group.get('nickname'));
						var relation = group.relation("followers");
						//relation.targetClassName = 'AV.User';
						var query = relation.query();
						//query.equalTo('objectId',groupObjId);
						query.find({
						  success: function(results) {
							// 处理返回的结果数据
							for (var i = 0; i < results.length; i++) {
							  (function(i){
								    var object = results[i];
								    console.log('find obj'+ object.get('nickname'));
									if(object.get('whichGroupNow')===groupid){
										if(type === 'image'){
											api.sendText(object.get('username'), queryUser.get('nickname')+'发了一张图片', function(err,results){
												        if(err){
															api.sendText(object.get('username'), queryUser.get('nickname')+'发了一张图片', function(err,results){
																
															});	
														}
														api.sendImage(object.get('username'), MediaId, function(err,results){
															  cb();
															  if(err){
																api.sendImage(object.get('username'), MediaId, function(err,results){
															
																});	
															  }
														});	
											});	
											
									    }
									    else if(type === 'voice'){
											api.sendText(object.get('username'), queryUser.get('nickname')+'发了一条语音', function(err,results){
														 if(err){
															api.sendText(object.get('username'), queryUser.get('nickname')+'发了一条语音', function(err,results){
																
															});	
														}
														api.sendVoice(object.get('username'), MediaId, function(err,results){
																cb();
															  if(err){
																api.sendVoice(object.get('username'), MediaId, function(err,results){
															
																});	
															  }
														});	
											});	
											
										}									
									}
								  
							   })(i);
							
							}
						  },
						  error: function(error) {
							//alert("Error: " + error.code + " " + error.message);
						  }
						});
						
					},
					error: function(object, error) {
					  
					}
				});
				
			},
			error: function(error) {
			} 
		});
	
	};
	this.groupChat_video = function(username,groupid,MediaId,type,thumb_media_id,cb){
		var query = new AV.Query(AV.User);
		query.equalTo("username", username);
		query.first({
			success: function(queryUser){
				console.log('find '+ queryUser.get('nickname'));
				var queryG = new AV.Query(Group);
				queryG.get(groupid,{
					success: function(group) {
						console.log('find '+ group.get('nickname'));
						var relation = group.relation("followers");
						//relation.targetClassName = 'AV.User';
						var query = relation.query();
						//query.equalTo('objectId',groupObjId);
						query.find({
						  success: function(results) {
							// 处理返回的结果数据
							for (var i = 0; i < results.length; i++) {
							  (function(i){
								    var object = results[i];
								    console.log('find obj'+ object.get('nickname'));
									if(object.get('whichGroupNow')===groupid){
										if(type === 'video'){
											api.sendText(object.get('username'), queryUser.get('nickname')+'发了一个视频', function(err,results){
														api.sendVideo(object.get('username'), MediaId,thumb_media_id, function(err,results){
														  cb();
														  console.log(JSON.stringify(results));
														});	
											});	
											
									    }								
									}
								  
							   })(i);
							
							}
						  },
						  error: function(error) {
							//alert("Error: " + error.code + " " + error.message);
						  }
						});
						
					},
					error: function(object, error) {
					  
					}
				});
				
			},
			error: function(error) {
			} 
		});
	
	};
	this.getGroupNotice = function(username,cb){
		var query = new AV.Query(AV.User);
		var isOwner = 0; //0不是群主，1是群主
		query.equalTo("username", username);
		query.first({
			success: function(queryUser) {
				var whichGroupNow = queryUser.get('whichGroupNow');
				var query = new AV.Query(Group);
				query.get(whichGroupNow, {
				success: function(group) {
					// 成功获得实例
					if(group.get('createdBy')===username){
						isOwner = 1;
						cb(isOwner,queryUser,group,group.get('groupNotice'));
					}
					else{
						cb(isOwner,queryUser,group,group.get('groupNotice'));
					}
				},
				error: function(object, error) {
				}
			  });
					
			},
			error: function(error) {
			} 
		});
	};
}
module.exports = userFollowed;
