'use strict';
var domain = require('domain');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var user = require('./routes/user');
var group = require('./routes/group');
var feed = require('./routes/feed');
var comment = require('./routes/comment');
var cloud = require('./cloud');
var WechatAPI = require('wechat-api');
var wechat = require('wechat');
var fs = require('fs');
var path = require('path');
var AV = require('leanengine');
var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
var OAuth = require('wechat-oauth');
var client = new OAuth('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
//var UserClass = require('./common/user_class.js'); 
var menu = JSON.stringify(require('./config/menu.json'));   //微信自定义菜单json数据
var app = express();
var config = {          //微信服务号相关数据
  token: 'ontheway',
  appid: 'wx88cb5d33bbbe9e75',
  encodingAESKey: 'dUpASyLHyc2X6ie3K5ZWBrbZHiFFJfYjXpfnNKaUud6'
};

// 设置 view 引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// 加载云代码方法
app.use(cloud);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.query());
app.use(AV.Cloud.CookieSession({secret: 'wegroup.av'}));
app.use('/wechat', wechat(config, function (req, res, next) {
  // 微信输入信息都在req.weixin上
  var message = req.weixin;
  if(message.MsgType === 'text')
  {
     res.reply({type: "text", content: '你发的信息是'+message.Content});
  }
  else if(message.MsgType === 'event')
  {
     if(message.Event === 'subscribe')
     {
          api.getUser({openid:message.FromUserName, lang: 'zh_CN'}, function (err, data, userres){
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
					res.reply({type: "text", content: '感谢您找到了我，注册成功！！！'});
                                },
                                error: function(newUser, error) {
						var query = new AV.Query(AV.User);
          					query.equalTo("username", message.FromUserName);
          					query.first({
                				success: function(queryUser) {
                        				queryUser.set('subscribe', 1 );
                        				queryUser.save();
                        				res.reply({type: "text", content: '您已经注册过了，欢迎再次回来！！！'}); 
                				},
                				error: function(error) {
                                		} });
					}
                    			});

                            
                        });
		
                 
     }
     else if(message.Event === 'unsubscribe')
     {
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
     else if (message.Event === 'CLICK' && message.EventKey === 'V1001_Recieve_Msg')
     {
         res.reply({type: "text", content:'您点击了接受消息这个按钮'});
     }
     else{}
   }
   else {} 
}));
api.createMenu(menu, function (err, result){});
//var userclass  = new UserClass();
//userclass.followedUserRegister();
//var status = new AV.Status('视频url', '我喜欢了视频xxxx.');
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
  var accessToken = result.data.access_token;
  var openid = result.data.openid;
  //if(openid === 'orSEhuNxAkianv5eFOpTJ3LXWADE' || openid === '')
  AV.User.logIn(openid, "A00000000~", {
  success: function(user) {
	// 成功了，现在可以做其他事情了.
	res.render('index', { openid: openid });
  },
  error: function(user, error) {
    // 失败了.
  }
});
  //	res.render('index', { openid: openid });
  //else res.render('index', { openid: '你没有权限访问，向管理员申请' });
  });
  
  //res.render('index', { openid: req.query.code });
});


// 可以将一类的路由单独保存在一个文件中
//app.use('/todos', todos);
app.use('/group', group);
app.use('/feed', feed);
app.use('/comment', comment);
app.use('/user', user);

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
