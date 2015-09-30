var router = require('express').Router();
var AV = require('leanengine');
var GroupPhotosClass = require('../common/groupPhotos_class.js');
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var fs = require('fs');
var path= require('path');
var OAuth = require('wechat-oauth');
var client = new OAuth('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
//var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
var Group=AV.Object.extend('Group');
var GroupPhotos = AV.Object.extend('GroupPhotos');
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
router.get('/', function(req, res, next) {
  
});


router.post('/', function(req, res, next) {
 
})

module.exports = router;
