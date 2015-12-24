var router = require('express').Router();
var UserClass = require('../common/user_class.js');
var userclass = new UserClass();
var AV = require('leanengine');
var request = require('request');
var WechatAPI = require('wechat-api');
//var wechat = require('wechat');
var OAuth = require('wechat-oauth');
var config = require('../config/config.js');	
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
	

router.get('/signup', function(req, resa, next) {
	var route = req.query.route;
 	client.getAccessToken(req.query.code, function (err, result) {
	  if(err){
			userclass.getUserObj('1111',function(err,user){
				if(err)
					resa.send('重试一下');
			});
	  }
		else{
			var openid = result.data.openid;
			var accessToken = result.data.access_token;
			var expires_in = result.data.expires_in;
			AV.User.logOut();
			AV.User._logInWith("weixin", {
				"authData": {
					"openid":openid,
					"access_token": accessToken,
					"expires_in": expires_in
				},
				success: function(newUser){
						//返回绑定后的用户
					userclass.getUserObj(openid,function(err,user){
						if(err){
							api.getUser({openid:openid, lang: 'zh_CN'}, function (err, data, userres){
								newUser.setPassword("A00000000~");
								newUser.setUsername(data.openid);
								newUser.set("openid", data.openid);
								newUser.set("nickname", data.nickname);
								newUser.set("sex", data.sex);
								newUser.set("subscribe", 1);
								newUser.set("country", data.country);
								newUser.set("province", data.province);
								newUser.set("city", data.city);
								//console.log('url'+data.headimgurl);
								if(data.headimgurl!=''){		//用户设置头像
									request({url:data.headimgurl,encoding:null},function(err,res,body){
										var headFile = new AV.File('head'+openid, body);
										headFile.save().then(function(file) {
											newUser.set("headimgurl", file.thumbnailURL(50,50));
											newUser.set("headimgSrc", file.url());
											newUser.set("headimgurlShare", file.thumbnailURL(360,200));
											newUser.save().then(function(user){
												resa.send("注册成功,关注[微群帮手]就可以使用了");
											});
										}, 
										function(error){

										});
									});
								}
								else{
									newUser.save().then(function(user){
										resa.send("注册成功,关注[微群帮手]就可以使用了");
									});
								}
							});	
						}
						else{
							if(route != 'feed')
								resa.send('登录成功,重新进入一下');
							else
								resa.redirect('/'+route);
						}
					});
				},
				error: function(err){
					console.dir(err);
				}	
		 });
	 }
 });
});

router.get('/login', function(req, res, next) {
 	client.getAccessToken(req.query.code, function (err, result) {
	  if(err){
			userclass.getUserObj('1111',function(err,user){
				if(err)
					resa.send('重试一下');
			});
	  }
		else{
			var openid = result.data.openid;
			userclass.getUserObj(openid,function(err,user){
				if(err){
					res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
				}
				else{
					AV.User.logIn(openid, "A00000000~", {
						success: function(user) {
							// 成功了，现在可以做其他事情了.
							res.send('登录成功,重新进入一下');
						},
						error: function(user, error) {
							// 失败了.
						}
					});
				}
			});
	 }
 });
});

module.exports = router;

	
