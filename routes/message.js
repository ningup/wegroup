var router = require('express').Router();
var AV = require('leanengine');
var UserClass = require('../common/user_class.js');
var MsgClass = require('../common/msg_class.js');
var userclass = new UserClass();
var msgclass  = new MsgClass();
//var Msg = AV.Object.extend('Message');

router.post('/', function(req, res, next) {
	var msgType = req.body.messageType;
	var cid = req.body.cid;
	var fid = req.body.fid;
	var toWhom = req.body.toWhom;
	var gid = req.body.gid;
	var mid = req.body.mid;
	//console.log('ha');
	if (AV.User.current()) {
		var username = AV.User.current().get('username');
		userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
			if(err){
				res.send('你还没有加入群呢，快去创建一个吧！');
			}
			else{
				var query = new AV.Query('Message');
				query.get(mid, {
					success: function(msg) {
						msg.set('unRead','0');
						msg.save();
						res.redirect('/comment/msg/detail?cid='+cid+'&fid='+fid+'&toWhom='+toWhom+'&gid='+gid+'&msgType='+msgType);
					},
					error: function(error) {
						// 失败了.
					}
				});
				
			}
		});
	}
	else{
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

router.get('/list', function(req, res, next) {
	if (AV.User.current()) {
		var username = AV.User.current().get('username');
		userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
			if(err){
				res.send('你还没有加入群呢，快去创建一个吧！');
			}
			else{
				msgclass.getFeedMsg(username,function(msgs){
						res.render('msg_list', {
							msgs:msgs,
							username: username
						});
			 });	
			}
		});
	}
	else{
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});

router.post('/history', function(req, res, next) {
	var skip = req.body.skip;
	var username = req.body.username;
	var query = new AV.Query('Message');
	query.descending('createdAt');
	query.equalTo("username",username);
	query.limit(20);
	query.skip(skip);
	query.find({
		success: function(msgs) {
			//console.log('hahaha'+msgs);
			res.json({"msgs":msgs});
			return;
		},
		error: function(error) {
			alert("Error: " + error.code + " " + error.message);
		}
	});
});

module.exports = router;
