var router = require('express').Router();
var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var FeedClass = require('../common/feed_class.js');   //引入Feed_class.js
var LikeClass = require('../common/like_class.js');
var sign=require('../common/sign.js');
var Group = AV.Object.extend('Group');
var Feed = AV.Object.extend('Feed');
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
//  feed 结果
router.get('/', function(req, res, next) {
	//var likeclass = new LikeClass();
	//likeclass.like('55fc293860b21fbf5733ec7d',req.query.username);
	var username = req.query.username;
	var groupObjIdGotInto = req.query.groupObjIdGotInto;
	var query = new AV.Query(Feed);
    query.descending('createdAt');
    query.include("feedImgArray");
    query.find({
    success: function(feeds) {
	   //url = (feeds[0].get('feedImgArray'))[0];
	  //console.log('url:'+url);
      res.render('feed', {
        title: 'Feed 列表',
        groupObjIdGotInto:groupObjIdGotInto,
        feeds: feeds,
        username: req.query.username
      });
    },
    error: function(err) {
      if (err.code === 101) {
        // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
        // 具体的错误代码详见：https://leancloud.cn/docs/error_code.html
        res.render('todos', {
          title: 'TODO 列表',
          groupObjIdGotInto:groupObjIdGotInto,
          username: req.query.username,
          feeds: []
        });
      } else {
        next(err);
      }
    }
  });
});
router.get('/publish', function(req, res, next) {
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
				var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/feed/publish?groupObjIdGotInto='+groupObjIdGotInto+'&username='+username);
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
								var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/feed/publish?groupObjIdGotInto='+groupObjIdGotInto+'&username='+username);
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
router.get('/groupMember', function(req, res, next) {
	res.render('feed_member', {
        title: 'Feed 列表',
        //feeds: feeds,
        //username: req.query.username
      });

});

// 新增 feed
router.post('/post', function(req, res, next) {
  var groupObjId=req.body.groupObjId;
  var feedContent=req.body.feedContent;
  var serverId = req.body.serverId;
  //var iid = req.body.iid;
  var feedType = req.body.feedType;
  var username = req.body.username;
  username = username.trim();
  var feedclass = new FeedClass(); 
  //console.log('...postfeed....'+iid);
  serverId=JSON.parse(serverId).serverId;
  //iid = JSON.parse(iid);

  //console.log('jjd length:'+iid.serverId.length);
  //console.log('jjd[0]:'+iid.serverId[0]);
  /*var serverId = new Array();
  serverId[0] = 'GYLFX0KpquT3JV7-vC6ltS6qyVjCFmw9VDTeTfx6uWu0J2PZg08CZGyNXDi5LZOk';
  serverId[1] = 'rK1U_mqzU9B28TwbdXrItOC9Mn8yP6zDUSYcFfXprW9nXlMT7HDWFrAGaUeoCDH2';
  serverId[2] = 'tCDcX2ZuSh3ZbvU5JDNEbe53uCzK05jfwUnFb-KvaCO3nkmduGWvC4DumpX-Zm1E';
  serverId[3] = 'O2l5EfYfhs__TtNCM9MXE--ja6dhUBTF5lhzE2Ut6qc0vfd_hBGlLzsgLa9kMOIN';
  serverId[4] = 'lf50DM_FsVO79xphxL1hkzneKdTgper2zMmZgwXozZFEGJdQk8bSebqaExc68GYC';
  serverId[5] = '3gA0Oz3853S8H7A_nvNM5UoH8FFEHgB7D5L2Yy_E1hZlBpdmLHqRGXMz-7fTscYB';
  serverId[6] = 'ES7JShKJgAn9kZU2VsRS4lwiapLuL3aqsjD78F5iov8xDXoEkkDOwtf2htKyUkdF';
  serverId[7] = 'Zho_AlJuLkwXrMbGI3xao58MDgc56cSqIupbITtFsuuPeTTUQwiYGvmWhY71l790';
  serverId[8] = 'YE94LDeVo4SOKoybRu1fxJ5M3SILOR05Hngmumo0qh1vf16j24r_WcFBp6-LwP-1';
  //console.log('serverIdLength:'+server.length);
  //console.log('serverId:'+server);
 */ 
  feedType = feedType.trim();
  console.log('feedType'+feedType);
  if(feedType === 'text'){
	  feedclass.postFeed_text(groupObjId,username,feedContent,function(){
			res.redirect('/feed?username='+username+'&groupObjIdGotInto='+groupObjId);
	   }); 
  }
  if (feedType === 'imgtext'){
		feedclass.postFeed_imgtext(groupObjId,username,feedContent,serverId,function(){
			res.redirect('/feed?username='+username+'&groupObjIdGotInto='+groupObjId);
	   }); 
  }
})



module.exports = router;
