var AV = require('leanengine');
var Msg = AV.Object.extend('Message');
function　MsgClass()
{
	this.feedMsg = function(username,messageType,msgContent,who,nickname,headimgurl,gid,cid,fid,groupName,cb){
		var msg = new Msg();
		msg.set('username',username);
		msg.set('messageType',messageType);
		msg.set('msgContent',msgContent);
		msg.set('who',who);
		msg.set('nickname',nickname);
		msg.set('headimgurl',headimgurl);
		msg.set('gid',gid);
		msg.set('cid',cid);
		msg.set('fid',fid);
		msg.set('unRead','1');
		msg.set('groupNickname',groupName);
		msg.save().then(function(msgobj){
			cb();
		});
	};
	this.getFeedMsg = function(username,cb){
		var query = new AV.Query('Message');
		query.descending('createdAt');
		query.equalTo("username",username);
		query.limit(20);
		query.find({
			success: function(msgs) {
				//console.log('hahaha'+msgs);
				cb(msgs);

			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
		});	
	};


};
module.exports = MsgClass;
