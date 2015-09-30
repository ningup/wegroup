var router = require('express').Router();
var AV = require('leanengine');
var GroupAlbumClass = require('../common/groupAlbum_class.js');
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var fs = require('fs');
var path= require('path');
var OAuth = require('wechat-oauth');
var client = new OAuth('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
//var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
var Group=AV.Object.extend('Group');
var GroupAlbum = AV.Object.extend('GroupAlbum');
var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c', function (callback) {
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
//显示群相册
router.get('/', function(req, res, next) {
	var username = req.query.username;
	var groupObjIdGotInto = req.query.groupObjIdGotInto;
	/*********query群相册**********/
	
});

//创建群相册渲染
router.get('/createAlbum', function(req, res, next) {
	 var username = req.query.username;
	 var groupObjIdGotInto = req.query.groupObjIdGotInto; 
	 /*********render**********/
});

//创建群相册
router.post('/createAlbum', function(req, res, next) {
	 var username = req.query.username;
	 //username = username.trim();
	 var groupObjIdGotInto = req.query.groupObjIdGotInto; 
	 var albumName = req.body.albumName;
	 var groupalbumclass = new GroupAlbumClass();
	 groupalbumclass.createAlbum(function(){
		 redirect('/groupAlbum?username='+username+'&groupObjIdGotInto='+groupObjId);
	 
	 });
		
});

//进入群相册渲染
router.get('/getIntoAlbum', function(req, res, next) {
	/*********query相册照片**********/
});

//上传相片渲染
router.get('/newPhotos', function(req, res, next) {
	var username = req.query.username;
	var groupObjIdGotInto = req.query.groupObjIdGotInto;
    var ticket;
    var groupclass = new GroupClass();
    var query = new AV.Query('WechatTicket');
    query.get("5606be0760b294604924a0c5", {
	   success: function(obj) {
		// 成功获得实例
			if((new Date().getTime()) < (JSON.parse(obj.get('ticket')).expireTime)){
					ticket = JSON.parse(obj.get('ticket')).ticket;
					var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/groupAlbum/newPhotos?groupObjIdGotInto='+groupObjIdGotInto+'&username='+username);
					console.log('not exoired'+ticket);
					console.log('.............'+jsapi.nonceStr);
					res.render('feed_publish', {
						//title: 'Groups 列表',
						groupObjIdGotInto:groupObjIdGotInto,
						username: username,
						nonceStr: jsapi.nonceStr,
						timestamp: jsapi.timestamp,
						signature: jsapi.signature
						//groups: results
					});
			}
			else{
					api.getLatestToken(function(){});
					api.getTicket(function(err,results){
						//console.log(JSON.stringify(results));
						console.log('guoqi?');
						ticket = results.ticket;
						obj.set('ticket',JSON.stringify(results));
						obj.save().then(function(obj){
							console.log('ticket expire time'+results.expireTime);
							var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/groupAlbum/newPhotos??groupObjIdGotInto='+groupObjIdGotInto+'&username='+username);
							//console.log('.............'+jsapi.nonceStr);
							res.render('feed_publish', {
								//title: 'Groups 列表',
								groupObjIdGotInto:groupObjIdGotInto,
								username: username,
								nonceStr: jsapi.nonceStr,
								timestamp: jsapi.timestamp,
								signature: jsapi.signature
								//groups: results
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


//上传相片
router.post('/upload', function(req, res, next) {
	  var groupObjId=req.body.groupObjId;
	  var groupAlbumObjId=req.body.groupAlbumObjId;
	  var username = req.body.username;
	  //username = username.trim();
	  var serverId = req.body.serverId;
  	  serverId=JSON.parse(serverId).serverId;
	  var groupalbumclass = new GroupAlbumClass();
	  groupalbumclass.upload(groupAlbumObjId,username,serverId,function(){
		  redirect('/groupAlbum?username='+username+'&groupObjIdGotInto='+groupObjId+'&groupAlbumObjId='+groupAlbumObjId);
	  });
})

module.exports = router;

