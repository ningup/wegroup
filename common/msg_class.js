var AV = require('leanengine');
var Msg = AV.Object.extend('Message');
function　MsgClass()
{
	this.feedMsg = function(username,messageType,msgContent,msgUrl,who,nickname,headimgurl,gid,cid,fid,cb){
		var msg = new Msg();
		msg.set('username',username);
		msg.set('messageType',messageType);
		msg.set('msgContent',msgContent);
		msg.set('msgUrl',msgUrl);
		msg.set('who',who);
		msg.set('nickname',nickname);
		msg.set('headimgurl',headimgurl);
		msg.set('gid',gid);
		msg.set('cid',cid);
		msg.set('fid',fid);
		msg.set('unRead','1');
		msg.save().then(function(msg){
			cb();
		});
	};
	this.groupMsg = function(username,messageType,msgContent,msgUrl,who,nickname,headimgurl,gid,cb){
		var msg = new Msg();
		//msg.set('username',username);  //不需要username,因为要通知到每一个user,　可以结合UserInfo表一起判断..具体需要斟酌，比如时间问题
		msg.set('messageType',messageType);
		msg.set('msgContent',msgContent);
		msg.set('msgUrl',msgUrl);
		msg.set('who',who);
		msg.set('nickname',nickname);
		msg.set('headimgurl',headimgurl);
		msg.set('gid',gid);
		msg.set('unRead','1');
		msg.save().then(function(msg){
			cb();
		});
	};


};
module.exports = MsgClass;
