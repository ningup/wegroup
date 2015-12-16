var AV = require('leanengine');
var Msg = AV.Object.extend('Message');
function　MsgClass()
{
	this.feedMsg = function(username,messageType,msgContent,msgUrl,who,nickname,headimgurl,gid,cid,fid,cb){
		var msg = new Msg();
		msg.set('username',username);
		msg.set('messageType',messageType);
		msg.set('msgContent',msgContent);
		//msg.set('msgUrl',msgUrl);
		msg.set('who',who);
		msg.set('nickname',nickname);
		msg.set('headimgurl',headimgurl);
		msg.set('gid',gid);
		msg.set('cid',cid);
		msg.set('fid',fid);
		msg.set('unRead','1');
		msg.save().then(function(msgobj){
			msgUrl = '/message?messageType='+messageType+'&cid='+cid+'&fid='+fid+'&toWhom='+who+'&gid='+gid+'&mid='+msg.id;
			msgobj.set('msgUrl',msgUrl);
			msgobj.save();
			cb();
		});
	};
	this.getFeedMsg = function(username,cb){
		var query = new AV.Query('Message');
		query.equalTo("username",username);
		query.find({
			success: function(msgs) {
				console.log('hahaha'+msgs);
				cb(msgs);
	/*			for(var i=0 ; i < msgs.length ; i++){
					var msg = msgs[i];
					console.log('msgType',messageType);
					console.log('who',msg.get('nickname'));
					console.log('content',msg.get('msgContent'));
					console.log('msgUrl',msg.get('msgUrl'));
					cb(msgs);
					
				}*/

			},
			error: function(error) {
				alert("Error: " + error.code + " " + error.message);
			}
		});	
	};


};
module.exports = MsgClass;
