//'use strict';
var domain = require('domain');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
//var groupAlbum = require('./routes/groupAlbum');
var user = require('./routes/user');
//var cookieSession = require('cookie-session');
var cookieParser = require('cookie-parser');
//var avosExpressCookieSession = require('avos-express-cookie-session');
var group = require('./routes/group');
var feed = require('./routes/feed');
var comment = require('./routes/comment');
var message = require('./routes/message');
var cloud = require('./cloud');
var WechatAPI = require('wechat-api');
var wechat = require('wechat');
var fs = require('fs');
var request = require('request');
var AV = require('leanengine');
var OAuth = require('wechat-oauth');
var UserClass = require('./common/user_class.js');
var GroupClass = require('./common/group_class.js');
var FeedClass = require('./common/feed_class.js');
var PublicClass = require('./common/public_class.js');
//var MsgClass = require('./common/msg_class.js');
var userclass  = new UserClass();
var groupclass = new GroupClass();
var feedclass = new FeedClass();
var publicclass = new PublicClass();
//var msgclass  = new MsgClass();
//var Group=AV.Object.extend('Group');
var config = require('./config/config.js');	
var menu = JSON.stringify(require('./config/menu.json'));   //微信自定义菜单json数据
var client = new OAuth(config.appid, config.appsecret);
var realtime = require('leancloud-realtime');
var api = new WechatAPI(config.appid, config.appsecret, function (callback) {
	// 传入一个获取全局token的方法
	var query = new AV.Query('WechatToken');
	query.get("5606afe9ddb2e44a47769124", {
		success: function(obj) {
    	callback(null, JSON.parse(obj.get('accessToken')));
  		},
  		error: function(object, error) {
  		}
	});  
	}, function (token, callback) {
	//请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
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
var app = express();

// 设置 view 引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 加载云代码方法
app.use(cloud);
//app.use(avosExpressCookieSession({ cookie: { maxAge: 3600000 }}));
app.use(AV.Cloud.CookieSession({secret: '05XgTktKPMkUUUU', maxAge: 86400000, fetchUser: false ,name:'liaoqu'}));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser('05XgTktKPMkUUUU',{}));
app.use(express.query());

app.use('/wechat', wechat(config, function (req, res, next) {
	// 微信输入信息都在req.weixin上
	res.end('');
	var message = req.weixin;
	var create_timeout;
	userclass.getUserObj(message.FromUserName,function(err,user){
		if(err){
			if(message.MsgType === 'event' && message.Event === 'subscribe'){
				var text = '还处于开发中，敬请关注！'+'<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect">点击注册</a>'; 
				api.sendText(message.FromUserName, text, function(err,results){
					if(err){
						api.sendText(message.FromUserName, err, function(err,results){
						});
					}							  
				});
			}
			else {
				var text = '您需要先注册一下，秒注册！'+'<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect">点击注册</a>';
				api.sendText(message.FromUserName, text, function(err,results){
					if(err){
						api.sendText(message.FromUserName, err, function(err,results){
						});
					}							  
				});
			}
		}
		else{
			if(message.MsgType === 'text'){
				if(user.get('whichStatus')==='wegroup_create'){
					var len = publicclass.getStrLen(message.Content);
					if(len > 20 || len < 4){
						var text = '字数要在2到10之间，嘿嘿~';
						api.sendText(message.FromUserName, text, function(err,results){
							if(err){
								api.sendText(message.FromUserName, err, function(err,results){
								});
							}							  
						});
					}
					else{
						user.set('tempGroupName',message.Content);
						user.save().then(function(userObj){
							var text = '您是否要创建微群'+'「'+message.Content+'」。'+'<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/group/create&response_type=code&scope=snsapi_base&state=123#wechat_redirect">点击创建</a>';
							api.sendText(message.FromUserName, text, function(err,results){
								if(err){
									api.sendText(message.FromUserName, err, function(err,results){
									});
								}							  
							});
						});	
					}
				}
				else if(user.get('whichStatus')==='wegroup_switch'){
					groupclass.groupSwitch(message.FromUserName,message.Content);		
				}
				else{

				}		
			}
			else if(message.MsgType === 'image' || message.MsgType === 'voice'){
				if(user.get('whichStatus')==='wegroup_create'){	
					var text = '群名字只能是文字哦'; 
					api.sendText(message.FromUserName, text, function(err,results){
						if(err){
							api.sendText(message.FromUserName, err, function(err,results){
							});
						}							  
					});
				}
				else if(user.get('whichStatus')==='wegroup_switch'){ 
					var text = '不是数字，请重新输入：'; 
					api.sendText(message.FromUserName, text, function(err,results){
						if(err){
							api.sendText(message.FromUserName, err, function(err,results){
							});
						}							  
					});
				}
				else{
				}		
			}
			else if(message.MsgType === 'video'){
				if(user.get('whichStatus')==='wegroup_create'){	
					var text = '群名字只能是文字哦'; 
					api.sendText(message.FromUserName, text, function(err,results){
						if(err){
							api.sendText(message.FromUserName, err, function(err,results){
							});
						}							  
					});
				}
				else if(user.get('whichStatus')==='wegroup_switch'){
					var text = '不是数字，请重新输入：'; 
					api.sendText(message.FromUserName, text, function(err,results){
						if(err){
							api.sendText(message.FromUserName, err, function(err,results){
							});
						}							  
					});     	
				}	
				else{
				}		
			}
			else if(message.MsgType === 'event'){
				if(message.Event === 'subscribe'){
					user.set('subscribe', 1);
					user.save();
					var text = '还处于开发中，敬请关注！';
					api.sendText(message.FromUserName, text, function(err,results){
						if(err){
							api.sendText(message.FromUserName, err, function(err,results){
							});
						}							  
					});
				}
				else if(message.Event === 'unsubscribe'){
					userclass.getUserObj(message.FromUserName,function(err,user){
						if(err){
						}
						else{
							user.set('subscribe', 0);
							user.save();
						}
					});
				} 
				else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_SWITCH'){
					user.set('whichStatus','wegroup_switch');
					user.set('tempGroupName','');
					user.save().then(function(userObj){
						userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
							if(err){
								var text = '你还没有加入群呢，快去创建一个吧！'; 
								api.sendText(message.FromUserName, text, function(err,results){
									if(err){
										api.sendText(message.FromUserName, err, function(err,results){
										});
									}							  
								}); 
							}
							else{
								userclass.getUserAllGroup(message.FromUserName,function(err,queryUser,results){
									var tempGroupSwitch = new Array();
									var content = '';
									content = '当前所在群是:'+'<'+whichGroupNameNow+'>\n'; 
									content += '所有群群如下,输入序号切换。\n';
									var j=0;
									for(var i=0; i<results.length; i++){
										j++;
										content +='['+i+']'+results[i].get('nickname')+'\n';
										tempGroupSwitch[i]=new Object();
										tempGroupSwitch[i].gid = results[i].getObjectId();
										tempGroupSwitch[i].nickname = results[i].get('nickname');
										if(j===results.length){
											user.set('tempGroupSwitch',tempGroupSwitch);
											user.save();
											var text = content;
											api.sendText(message.FromUserName, text, function(err,results){
												if(err){
													api.sendText(message.FromUserName, err, function(err,results){
													});
												}							  
											}); 
										}						
									}
								}); 	 
							}
						});
					});
				}
				else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_CREATE'){
					user.set('whichStatus','wegroup_create');
					user.set('tempGroupName','');
					user.save().then(function(userObj){
						var text = '进入创建群功能，群聊功能关闭，请输入你想创建的群名';
						api.sendText(message.FromUserName, text, function(err,results){
							if(err){
								api.sendText(message.FromUserName, err, function(err,results){
								});
							}							  
						}); 
					});			
				}
				else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_SHARE_JOIN'){
					userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
						if(err){
							var text = '你还没有加入群呢，快去创建一个吧！'; 
							api.sendText(message.FromUserName, text, function(err,results){
								if(err){
									api.sendText(message.FromUserName, err, function(err,results){
									});
								}							  
							}); 
						}
						else{
							var whichGroupNow = user.get('whichGroupNow');
							var whichGroupNameNow = user.get('whichGroupNameNow');
							var articles = [
								{
								 "title":	'群名：'+whichGroupNameNow+' 点击加入',
								 "description":'微群帮',
								 "url":'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/group/join?id='+whichGroupNow+'&response_type=code&scope=snsapi_base&state=123#wechat_redirect',
								 "picurl":user.get('headimgurlShare')
								}];
								api.sendNews(message.FromUserName, articles, function(err,results){
								if(err){
									api.sendText(message.FromUserName, err, function(err,results){
									});
								}							  
							}); 
						}
					});
					user.set('whichStatus','wegroup_chat');
					user.set('tempGroupName','');
					user.set('tempGroupSwitch',[]);
					user.save();
				}
				else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_NOTICE'){
					userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
						if(err){
							var text = '你还没有加入群呢，快去创建一个吧！'; 
							api.sendText(message.FromUserName, text, function(err,results){
								if(err){
									api.sendText(message.FromUserName, err, function(err,results){
									});
								}							  
							}); 
						}
						else{
							userclass.getGroupNotice(message.FromUserName,function(isOwner,queryUser,group,groupNotice){
								if(isOwner===1){  //是群主
									var text='' ;
									if(groupNotice ==='void'){
										console.log('notice',groupNotice);
										text = '你还没有设置群公告';
									}
									else{
										text = groupNotice;
									}
									text += '\n';
									text+='<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/group/notice&response_type=code&scope=snsapi_base&state=123#wechat_redirect">点击编辑群公告</a>';
									api.sendText(message.FromUserName, text, function(err,results){
										if(err){
											api.sendText(message.FromUserName, text, function(err,results){
											});
										}							  
									});
								}
								else{				//不是群主
									var text='';
									if(groupNotice==='void'){
										text += '群主还没有设置群公告';
									}
									else{
										text = groupNotice;
									}
									api.sendText(message.FromUserName, text, function(err,results){
										if(err){
											api.sendText(message.FromUserName, text, function(err,results){
											});
										}							  
									});
								}
							});
						}
					});
					user.set('whichStatus','wegroup_chat');
					user.set('tempGroupName','');
					user.set('tempGroupSwitch',[]);
					user.save();
				}
				else{}
			}
			else {} 
			
		}
	});

}));


/*
api.getTicket(function(err,results){
	//console.log(JSON.stringify(results));
	console.log(results);
	
});
*/
//api.getAccessToken();  //get latest accesstoken
/*api.createMenu(menu, function (err, result){
	//if(err)
	console.log(JSON.stringify(result));
});*/


/*api.getMenu(function(err,results){
	console.log(JSON.stringify(results));	
}); */

/*api.removeMenu(function(err,results){
	console.log(JSON.stringify(results));
});*/


// 未处理异常捕获 middleware
app.use(function(req, res, next) {
   var d = null;
  if (process.domain) {
    d = process.domain;
  } else {
    d = domain.create();
  }
  d.add(req);
  d.add(res);
  d.on('error', function(err) {
    console.error('uncaughtException url=%s, msg=%s', req.url, err.stack || err.message || err);
    if(!res.finished) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json; charset=UTF-8');
      res.end('uncaughtException');
    }
  });
  d.run(next);
});

app.get('/', function(req, res) {
	//console.log(req.AV.user);
 	client.getAccessToken(req.query.code, function (err, result) {
	  if(err){
			AV.User.logIn("orSEhuNxAkianv5eFOpTJ3LXWADE", "A00000000~", {
				success: function(user) {
					// 成功了，现在可以做其他事情了.
						res.redirect('/feed');
				},
				error: function(user, error) {
					// 失败了.
				}
			});
	  }else{
			var openid = result.data.openid;
			var accessToken = result.data.access_token;
			var user = new AV.User(); 
			user.id = AV.User.current().id;
			user.fetch().then(function(user){
				if((user.get('username') == openid) ){
					res.redirect("/feed");
				}
				else{
					res.redirect("https://open.weixin.qq.com/con nect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");

				}
			});
	 }
 }); 
});

// 可以将一类的路由单独保存在一个文件中
//app.use('/todos', todos);
app.use('/group', group);
app.use('/feed', feed);
app.use('/comment', comment);
app.use('/user', user);
app.use('/message', message);
//app.use('/groupAlbum', groupAlbum);


// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) { // jshint ignore:line
    var statusCode = err.status || 500;
    if(statusCode === 500) {
      console.error(err.stack || err);
    }
    res.status(statusCode);
    res.render('error', {
      message: err.message || err,
      error: err
    });
  });
}

// 如果是非开发环境，则页面只输出简单的错误信息
app.use(function(err, req, res, next) { // jshint ignore:line
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
