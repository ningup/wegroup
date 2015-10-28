//'use strict';
var domain = require('domain');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
//var groupAlbum = require('./routes/groupAlbum');
//var user = require('./routes/user');
var group = require('./routes/group');
var feed = require('./routes/feed');
//var comment = require('./routes/comment');
var cloud = require('./cloud');
var WechatAPI = require('wechat-api');
var wechat = require('wechat');
var fs = require('fs');
var AV = require('leanengine');
var OAuth = require('wechat-oauth');
var UserClass = require('./common/user_class.js');
var GroupClass = require('./common/group_class.js');
var userclass  = new UserClass();
var groupclass = new GroupClass();
var Group=AV.Object.extend('Group');
var config = require('./config/config.js');	
var menu = JSON.stringify(require('./config/menu.json'));   //微信自定义菜单json数据
var client = new OAuth(config.appid, config.appsecret);
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
  // 请将token存储到全局，跨进程、跨机器级别的全局，比如写到数据库、redis等
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
app.use(AV.Cloud.CookieSession({secret: 'wegroup', maxAge: 3600000,fetchUser: false}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.query());

app.use('/wechat', wechat(config, function (req, res, next) {
  // 微信输入信息都在req.weixin上
  var message = req.weixin;
  var create_timeout;
  if(message.MsgType === 'text'){
	  userclass.getUserObj(message.FromUserName,function(err,user){
			if(user.get('whichStatus')==='wegroup_create'){
				user.set('tempGroupName',message.Content);
				user.save().then(function(userObj){
					res.reply({type: "text", content: '您是否要创建微群'+'「'+message.Content+'」。'+'<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/group/create&response_type=code&scope=snsapi_base&state=123#wechat_redirect">点击创建</a>'});
				});
				
			}
			else if(user.get('whichStatus')==='wegroup_switch'){
				res.reply('');      //回复空串
				groupclass.groupSwitch(message.FromUserName,message.Content);
				
				
			}
			else if(user.get('whichStatus')==='wegroup_chat'){
				res.reply('');      //回复空串
				userclass.groupChat_text(message.FromUserName,user.get('whichGroupNow'),message.Content,function(){
					//res.reply('');      //回复空串
				});
				
				
			}	
			else{
				res.reply({type: "text", content: '你发的信息是'+message.Content});
			}		
	  });
     //res.reply({type: "text", content: '你发的信息是'+message.Content});
  }
  else if(message.MsgType === 'image' || message.MsgType === 'voice'){
	  userclass.getUserObj(message.FromUserName,function(err,user){
			if(user.get('whichStatus')==='wegroup_create'){
				
			 res.reply({type: "text", content: '群名字只能是文字哦'});
	
			}
			else if(user.get('whichStatus')==='wegroup_chat'){
				res.reply('');      //回复空串
				userclass.groupChat_media(message.FromUserName,user.get('whichGroupNow'),message.MediaId,message.MsgType,function(){
					//res.reply('');      //回复空串
				});
				
				
			}	
			else if(user.get('whichStatus')==='wegroup_switch'){
				res.reply('不是数字，请重新输入：');     
		
			}
			else{
				res.reply('');
			}		
	  });
     //res.reply({type: "text", content: '你发的信息是'+message.Content});
  }
  else if(message.MsgType === 'video'){
	  userclass.getUserObj(message.FromUserName,function(err,user){
			if(user.get('whichStatus')==='wegroup_create'){
				
			 res.reply({type: "text", content: '群名字只能是文字哦'});
	
			}
			else if(user.get('whichStatus')==='wegroup_chat'){
				res.reply('目前还不支持视频！');      //回复空串
				//userclass.groupChat_video(message.FromUserName,user.get('whichGroupNow'),message.MediaId,message.MsgType,message.thumb_media_id,function(){
					//res.reply('');      //回复空串
				//});
				
				
			}	
			else if(user.get('whichStatus')==='wegroup_switch'){
				res.reply('不是数字，请重新输入：');      
		
			}	
			else{
				res.reply('');
			}		
	  });
     //res.reply({type: "text", content: '你发的信息是'+message.Content});
  }
  else if(message.MsgType === 'event'){
     if(message.Event === 'subscribe'){
          userclass.signUp(message.FromUserName,function(err,result){
				if(err)
					res.reply({type: "text", content: '您已经注册过了，快来看看你错过了什么！'})
				else
					res.reply({type: "text", content: '感谢您找到了我，注册成功，开启便捷群生活！'});
		  });
            
     }
     else if(message.Event === 'unsubscribe'){
        var query = new AV.Query(AV.User);
	    query.equalTo("username", message.FromUserName);
	    query.first({
		 success: function(queryUser) {
			queryUser.set('subscribe', 0 );
			queryUser.save();
		 },
  		 error: function(error) {
    		//alert("Error: " + error.code + " " + error.message);
  		 }
	   });
     } 
     else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_SWITCH'){
		 userclass.getUserObj(message.FromUserName,function(err,user){
				user.set('whichStatus','wegroup_switch');
				user.set('tempGroupName','');
				user.save().then(function(userObj){
							 userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
							 if(err){
								 res.reply({type: "text", content: '你还没有加入群呢，快去创建一个吧！'});
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
											 //content += '<a href=\"'+'dev.wegroup.avosapps.com/group/switchPre?id='+results[i].getObjectId()+'\">'+'「'+results[i].get('nickname')+'」'+'<\/a>';	
											 content +='['+i+']'+results[i].get('nickname')+'\n';
											 tempGroupSwitch[i]=new Object();
											 tempGroupSwitch[i].gid = results[i].getObjectId();
											 tempGroupSwitch[i].nickname = results[i].get('nickname');
											 if(j===results.length){
												  user.set('tempGroupSwitch',tempGroupSwitch);
												  user.save();
												  res.reply({type: "text", content: content});
								
											 }
												
										 }
								}); 	 
							 }
						 
						 });
				});
				
		 });

       
     }
     else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_CREATE'){
		 userclass.getUserObj(message.FromUserName,function(err,user){
				user.set('whichStatus','wegroup_create');
				user.set('tempGroupName','');
				user.save().then(function(userObj){
					res.reply({type: "text", content: '进入创建群功能，群聊功能关闭，请输入你想创建的群名'});
				});
				
		 });
       
     }
     else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_GROUP_CHAT'){
		 userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
			 if(err){
				 res.reply({type: "text", content: '你还没有加入群呢，快去创建一个吧！'});
			 }
			 else{
				 userclass.getUserObj(message.FromUserName,function(err,user){
						user.set('whichStatus','wegroup_chat');
						user.set('tempGroupName','');
						user.set('tempGroupSwitch',[]);
						user.save().then(function(userObj){
							res.reply({type: "text", content: '群聊功能开启，可以在'+'「'+user.get('whichGroupNameNow')+'」群中与大家聊天了'});
						});
						
				 });
				 
			 }
		});
		
       
     }
     else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_SHARE_JOIN'){
		  userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
			 if(err){
				 res.reply({type: "text", content: '你还没有加入群呢，快去创建一个吧！'});
			 }
			 else{
				 		 userclass.getUserObj(message.FromUserName,function(err,user){
								var whichGroupNow = user.get('whichGroupNow');
								var whichGroupNameNow = user.get('whichGroupNameNow');
								res.reply([
								{
								title: '群名：'+whichGroupNameNow+' 点击加入',
								description: '微群帮',
								picurl: user.get('headimgurl'),
								url: 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/group/join?id='+whichGroupNow+'&response_type=code&scope=snsapi_base&state=123#wechat_redirect'
								}
							]);
								
						 });
			 }
		});


     }
     else if (message.Event === 'CLICK' && message.EventKey === 'WEGROUP_NOTICE'){
        userclass.getCurrentGroup(message.FromUserName,function(err,whichGroupNow,whichGroupNameNow){
			 if(err){
				 res.reply({type: "text", content: '你还没有加入群呢，快去创建一个吧！'});
			 }
			 else{
				 res.reply('');
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
     }
     else{
	 
	 }
   }
   else {} 
}));

/*
api.getTicket(function(err,results){
	 //console.log(JSON.stringify(results));
	 console.log(results);
	
});*/
/*
api.createMenu(menu, function (err, result){
	//if(err)
		console.log(JSON.stringify(result));
});

/*
api.getMenu(function(err,results){
	
	console.log(JSON.stringify(results));
	
}); 
*/
/*api.removeMenu(function(err,results){
        console.log(JSON.stringify(results));
});*/



// 未处理异常捕获 middleware
app.use(function(req, res, next) {
  var d = domain.create();
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
  
  client.getAccessToken(req.query.code, function (err, result) {
	  //var accessToken = result.data.access_token;
	  //var openid = result.data.openid;
	  //if(openid === 'orSEhuNxAkianv5eFOpTJ3LXWADE' || openid === '')
	  if(err){
		  //userclass.followedUserRegister();
		  /*
		  var text = '这条消息是公众号主动发给你的，前提是48小时之内，用户主动发消息给公众号（包括发送信息、点击\
		  自定义菜单、订阅事件、扫描二维码事件、支付成功事件、用户维权）。'
		  api.sendText('orSEhuBllBij-g3Ayx2jujBuuPNY', text, function(err,results){
			  console.log(JSON.stringify(results));
		  });
		  api.sendText('orSEhuNxAkianv5eFOpTJ3LXWADE', text, function(err,results){
			  console.log(JSON.stringify(results));
		  });
		  res.send('请从微信进入'); */
		  //userclass.groupChat_text(username,whichGroupNow,'text',function(){});
				/*
				var username = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
				var username1 = 'orSEhuBllBij-g3Ayx2jujBuuPNY';
				var whichGroupNow='5624652bddb24819b84456d6';  
				userclass.isGroupJoined(username,whichGroupNow,function(status,obj){
					  if(status === 1)
							res.send('已加入');
					  else if (status === 2)
							res.send('未加入');
					  else if (status === 0)
							res.send('未关注');
				});*/
				var whichGroupNow='5624636e00b07c4da719f74a'; 
				var username = 'orSEhuNxAkianv5eFOpTJ3LXWADE';
				var username1 = 'orSEhuBllBij-g3Ayx2jujBuuPNY';/*
				userclass.getGroupNotice(username,function(isOwner,queryUser,group,groupNotice){
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
						text+='<a href="https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/group&response_type=code&scope=snsapi_base&state=123#wechat_redirect">点击编辑群公告</a>';
						api.sendText(username, text, function(err,results){
							if(err){
								api.sendText(username, text, function(err,results){
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
						
						api.sendText(username, text, function(err,results){
							if(err){
								api.sendText(username, text, function(err,results){
								});
							}							  
						 });
					}
				}); */
				/*
						groupclass.quitGroup(username,function(){
								
								userclass.getUserAllGroup(username,function(err,queryUser,results){
									if(results[0].length === 0){
											queryUser.set('whichGroupNow','');
											queryUser.set('whichGroupNameNow','');
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
									
									res.send('退出成功');
									
								});
								
							});*/
				
				


	  }else{
		  AV.User.logIn(openid, "A00000000~", {
			  success: function(user) {
				//res.redirect('/group?username='+openid);
				//res.redirect('https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wctest.avosapps.com/group&response_type=code&scope=snsapi_base&state=123#wechat_redirect');
			  },
			  error: function(user, error) {
				// 失败了.
			  }
		  });
	 }
  });
  
});


// 可以将一类的路由单独保存在一个文件中
//app.use('/todos', todos);
app.use('/group', group);
app.use('/feed', feed);
//app.use('/comment', comment);
//app.use('/user', user);
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
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
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
