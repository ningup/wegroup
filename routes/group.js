var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var UserClass = require('../common/user_class.js'); 
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var fs = require('fs');
var path= require('path');
var OAuth = require('wechat-oauth');
var realtime = require('leancloud-realtime');
var config = require('../config/config.js');
var client = new OAuth(config.appid, config.appsecret);
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

//声明一个Group类，为避免堆栈溢出，放到全局变量里面
//var Group = AV.Object.extend('Group');
var UserInfo=AV.Object.extend('UserInfo');
// 搜索 Groups 结果
router.get('/', function(req, res, next) {
	client.getAccessToken(req.query.code, function (err, result) {
		if(err){
		 	res.send('请从微信进入');
		}
		else{ 
			var username = result.data.openid;
			var userclass = new UserClass();
			userclass.getUserAllGroup(username,function(err,results){
				res.render('group', {
					username: username,
					groups: results
				});
			});
		}
	});   						
});

router.get('/create', function(req, res, next){
  var groupclass = new GroupClass();
  var nickname;
  var userclass = new UserClass();
  client.getAccessToken(req.query.code, function (err, result){
		if(err){
			res.send('请从微信进入');
		}
		else{
			var username = result.data.openid;
			userclass.getUserObj(username,function(err,user){
				nickname = user.get('tempGroupName'); 
				var groupclass = new GroupClass();
				if((user.get('tempGroupName')!='') && (user.get('whichStatus')==='wegroup_create')){
					var appId = 'DKHKFtC7GKQ73o88sUgyEEON';
					var clientId = username;
					var realtimeObject = realtime.realtime({
						 appId: appId,
						 clientId: clientId,
						 secure: false
					});
					realtimeObject.on('open', function(data){
						var room = realtimeObject.room({
								members: [		
								],
								name: nickname,
								transient: true,
								attr: {
									test: 'testTitle'
								}
						}, function(resultid){
							groupclass.create('flagImg','serverId','groupColor',nickname,username,resultid.id,function(err,group){
								user.set('tempGroupName','');
								user.set('whichStatus','wegroup_chat');
								user.save().then(function(userObj){
									res.redirect('/group/fini?title=群创建好了');
									var text = '成功创建,已切换到「'+nickname+'」群中。'
										api.sendText(username, text, function(err,results){
												//console.log(JSON.stringify(results));
										});
								});
							});
						});
					});	
				}		
				else{
					res.send('没有群可创建或者该群已经被创建');
				}
			}); 
		}
	});
});

router.get('/room', function(req, res, next) {
	if (req.AV.user) {
		var user = new AV.User(); 
		user.id = req.AV.user.id;
		user.fetch().then(function(user){
			var userclass = new UserClass();
			var username = user.get('username');
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
					res.send('你还没有加入群呢，快去创建一个吧！');
				}
				else{
					var groupObjId = whichGroupNow;
					var query = new AV.Query('Group');
					query.get(groupObjId, {
						success: function(group) {
							// 成功获得实例
							res.render('chat', {
								username:username,
								roomId:group.get('roomId')
							});	
						},
						error: function(object, error) {
						// 失败了.
						}
					});
				}
			});
		});
	}
	else{
		//res.send('我不知道你是谁了，重新进入一下吧');
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

/*router.post('/createSet', function(req, res, next) {
	var pushMsg2Wechat=req.body.pushMsg2Wechat;
  var identityVerify=req.body.identityVerify;
	var username = req.query.username;
  //console.log('post...'+username);
	var groupObjId = req.query.groupObjId;
  //console.log("post ....."+groupObjId);
	//console.log('push'+pushMsg2Wechat+'iden'+identityVerify);
	var groupclass = new GroupClass();
 	groupclass.groupSet(groupObjId,pushMsg2Wechat,identityVerify);
});*/

/*router.get('/search',function(req,res,next){
	var searchString=req.query.searchString;
	var username = req.query.username;
	var recommandOrNot = req.query.recommandOrNot; 
	var groupclass = new GroupClass();
	var querys = new AV.SearchQuery('Group');
	if(recommandOrNot==='0'){
		console.log(searchString);
		if(searchString === 'all'){
			querys.queryString('*');
		}
		else {
			querys.queryString(searchString+'~3');
			//querys.queryString('nickname:'+'['+searchString+']');
		}
		querys.find().then(function(results) {
			//console.log('Found %d objects', querys.hits());
			//Process results
			if(results.length===0){
				res.render('group_search', {
					//title: 'Groups 列表',
					username: req.query.username,
					groups: results
				});
			}
			else{
				groupclass.groupQuery(results,function(err,finalGroups){
				console.log('final');
					res.render('group_search', {
						//title: 'Groups 列表',
						username: req.query.username,
						groups: finalGroups
					});
				});
			}   
		}); 
	}
	else{
		querys.queryString('*');
		querys.find().then(function(results) {
			console.log('Found %d objects', querys.hits());
			if(results.length===0){
				res.render('group_search', {
					//title: 'Groups 列表',
					username: req.query.username,
					groups: results
				});
			}
			else{
				groupclass.groupQuery(results,function(err,finalGroups){
					console.log('final');
					res.render('group_search', {
						//title: 'Groups 列表',
						username: req.query.username,
						groups: finalGroups
					});
				});
			}
		});
	}
});

//查询群
router.post('/search',function(req,res,next){
 	var searchString=req.body.targetGroup;
	var username = req.query.username;
  res.redirect('/group/search?username='+req.query.username+'&searchString='+searchString+'&recommandOrNot=0');
})*/

//加入群
router.get('/join',function(req,res,next){
	client.getAccessToken(req.query.code, function (err, result) {
		if(err){

		}
		else{ 
			var username = result.data.openid;
			var groupObjIdJoined = req.query.id;
			var userclass = new UserClass();
			userclass.isGroupJoined(username,groupObjIdJoined,function(status,obj){
				if(status === 1)
					res.send('已加入');
				else if (status === 3){
					res.send('该群已经解散了');
				}
				else if (status === 2){
					var groupclass = new GroupClass();
					groupclass.joinGroup(groupObjIdJoined,username,function(err,queryUser){
						if(err){
							res.send('该群解散了');
						}
						else{
							var query = new AV.Query('Group');
							var userinfo = new UserInfo();
							userinfo.set('username',username);
							userinfo.set('groupid',groupObjIdJoined);
							userinfo.set('nicknameInGroup',queryUser.get('nickname'));
							userinfo.set('headimgurl',queryUser.get('headimgurl'));
							userinfo.set('signInTime',new Date());
							query.get(groupObjIdJoined,{
								success:function(group){
									var followersNum = group.get('followersNum');
									followersNum ++;
									group.set('followersNum',followersNum);
									var relation = group.relation('followers');
									relation.add(queryUser);
									group.save().then(function(group){
										userinfo.set('groupName',group.get('nickname'));
										userinfo.save();
										var text = '成功加入并切换到「'+group.get('nickname')+'」群'
										api.sendText(username, text, function(err,results){
											if(err){
												api.sendText(username, text, function(err,results){
												});
											}
										});
										res.send('加入成功');
									},function(err){});
								},
								error:function(error){
								}
							});
						}
					}); 
				}
				else if (status === 0)
					res.send('未关注或者未注册');
			});
		}
	});
});

router.post('/head/img', function(req, res, next) {
	var groupObjId = req.body.groupObjId;
	var groupHeadImg = req.body.groupHeadImg;
	//console.log(groupObjId);
	var query = new AV.Query('Group');
	query.get(groupObjId, {
		success: function(group) {
			// 成功获得实例
			group.set('groupHeadImg',groupHeadImg);
			group.save().then(function(group){
				res.json({"status":"0","groupHeadImg":groupHeadImg});
				return ;
			});
		},
		error: function(error) {
			// 失败了.
		}
	});		
});

router.get('/set', function(req, res, next) {
	if (req.AV.user) {
		var user = new AV.User(); 
		user.id = req.AV.user.id;
		user.fetch().then(function(user){
			var username = user.get('username');
			var userclass = new UserClass();
			userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
				if(err){
					res.send('你还没有加入群呢，快去创建一个吧！');
				}
				else{
					var groupObjId = whichGroupNow;
					var groupNickname = whichGroupNameNow;
					var groupObjId = whichGroupNow;
					var query = new AV.Query('Group');
					query.get(groupObjId, {
						success: function(group) {
							// 成功获得实例
							var relation = group.relation("followers");
							//relation.targetClassName = 'Feed';
							var queryFollowers = relation.query();
							queryFollowers.limit(20);
							queryFollowers.find().then(function(users){
								res.render('group_set_new', {
									users: users,
									groupNickname:groupNickname,
									groupCode:group.get('groupCode'),
									userNickname:user.get('nickname'),
									groupFollowersNum:group.get('followersNum')
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
	}
	else{
		//res.send('我不知道你是谁了，重新进入一下吧');
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}						
});

router.get('/quit_group', function(req, res, next) {
	if(req.AV.user){
		var user = new AV.User(); 
		user.id = req.AV.user.id;
		user.fetch().then(function(user){
			var username =user.get('username');
			var userclass = new UserClass();
			var groupclass = new GroupClass();
			groupclass.quitGroup(username,function(){
				userclass.getUserAllGroup(username,function(err,queryUser,results){
					if(results[0] == null){
							queryUser.set('whichGroupNow','0');
							queryUser.set('whichGroupNameNow','0');
							queryUser.save().then(function(){});
					}
					else{
						var newUser = results[0]
						queryUser.set('whichGroupNow',newUser.getObjectId());
						queryUser.set('whichGroupNameNow',newUser.get('nickname'));
						queryUser.save().then(function(){
							var text = '切换到「'+newUser.get('nickname')+'」群';
							api.sendText(username, text, function(err,results){
								if(err){
									api.sendText(username, text, function(err,results){
									});
								}							  
							});
						});
					}
					res.redirect('/group/fini?title=退群成功');
				});
			});
		});
	}
	else{
		//res.send('我不知道你是谁了，重新进入一下吧');
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}	
});

router.get('/notice', function(req, res, next) {
	client.getAccessToken(req.query.code, function (err, result) {
		if(err){
			res.send('请从微信进入');
		}
		else{ 
			var username = result.data.openid;
			res.render('notice', {
				username: username
			});
		}
	});
});

router.post('/notice', function(req, res, next) {
	var groupNotice=req.body.groupNotice;
	var username = req.body.username;
	var userclass = new UserClass();
	userclass.setGroupNotice(username,groupNotice,function(queryUser,groupSaved){
		var text = '群公告已经更新，可点击群公告查看'
		api.sendText(username, text, function(err,results){
			if(err){
				api.sendText(username, text, function(err,results){
				});
			}
		});
		res.redirect('/group/fini?title=公告更新成功');
	});		
});

router.get('/fini', function(req, res, next) {
	var title = req.query.title;
	var ticket;
	var query = new AV.Query('WechatTicket');
	query.get("5606be0760b294604924a0c5", {
		success: function(obj) {
			// 成功获得实例
			if((new Date().getTime()) < (JSON.parse(obj.get('ticket')).expireTime)){
				ticket = JSON.parse(obj.get('ticket')).ticket;
				var jsapi=sign(ticket, 'http://dev.wegroup.avosapps.com/group/fini?title='+title);
				res.render('fini', {
					nonceStr: jsapi.nonceStr,
					timestamp: jsapi.timestamp,
					signature: jsapi.signature,
					title:title
				});		
			}
			else{
				api.getLatestToken(function(){});
				api.getTicket(function(err,results){
					ticket = results.ticket;
					obj.set('ticket',JSON.stringify(results));
					obj.save().then(function(obj){
						var jsapi=sign(ticket, 'http://dev.wegroup.avosapps.com/group/fini?title='+title);
						res.render('fini', {
						nonceStr: jsapi.nonceStr,
						timestamp: jsapi.timestamp,
						signature: jsapi.signature,
						title:title
						 });
					});
				});
			}
		},
		error: function(object, error) {
		// 失败了.
		}
	}); 
});

module.exports = router;
