'use strict';
var domain = require('domain');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var todos = require('./routes/todos');
var user = require('./routes/user');
var cloud = require('./cloud');
var WechatAPI = require('wechat-api');
var wechat = require('wechat');
var fs = require('fs');
var path = require('path');
var AV = require('leanengine');
var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
var menu = JSON.stringify(require('./config/menu.json'));
//var followers;
var app = express();
var config = {
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
        res.reply({type: "text", content: '感谢您找到了我！！！'});
     }
     else if (message.Event === 'CLICK' && message.EventKey === 'V1001_Recieve_Msg')
     {
      api.getUser({openid:message.FromUserName, lang: 'zh_CN'}, function (err, data, userres){
        res.reply([
        {
        title: data.nickname+'的个人信息',
        description: '你来自'+data.country+' '+data.province+' '+data.city,
        picurl: data.headimgurl,
        url: 'baidu.com'
        }
         ]);
       });
     }
     else{}
   }
   else {} 
}));
api.createMenu(menu, function (err, result){});
api.getFollowers(function (err, data, resf) {
    fs.writeFile(path.join('./config','userlist'),data.data.openid[0] ,function(errw){} );

});

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
  res.render('index', { currentTime: new Date() });
});


// 可以将一类的路由单独保存在一个文件中
app.use('/todos', todos);
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
