var router = require('express').Router();
var AV = require('leanengine');
var UserClass = require('../common/user_class.js');
var userclass = new UserClass();
//var Msg = AV.Object.extend('Message');

router.get('/', function(req, res, next) {
	var msgType = req.query.messageType;
	var cid = req.query.cid;
	var fid = req.query.fid;
	var toWhom = req.query.toWhom;
	var gid = req.query.gid;
	if (AV.User.current()) {
		var username = AV.User.current().get('username');
		userclass.getCurrentGroup(username,function(err,whichGroupNow,whichGroupNameNow){
			if(err){
				res.send('你还没有加入群呢，快去创建一个吧！');
			}
			else{
				res.redirect('/comment/msg/detail?cid='+cid+'&fid='+fid+'&toWhom='+toWhom+'&gid='+gid+'&msgType='+msgType);
			}
		});
	}
	else{
		res.redirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx88cb5d33bbbe9e75&redirect_uri=http://dev.wegroup.avosapps.com/user/signup&response_type=code&scope=snsapi_base&state=123#wechat_redirect");
	}
});


router.post('/', function(req, res, next) {

})

module.exports = router;
