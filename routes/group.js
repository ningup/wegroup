var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var UserClass = require('../common/user_class.js'); 
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var fs = require('fs');
var path= require('path');
//var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
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
//声明一个Group类，为避免堆栈溢出，放到全局变量里面
var Group = AV.Object.extend('Group');

// 搜索 Groups 结果
router.get('/', function(req, res, next) {
    var username = req.query.username;
    var userclass = new UserClass();
    userclass.getUserAllGroup(username,function(err,results){
			res.render('group', {
					//title: 'Groups 列表',
					username: username,
					groups: results
		    });
		
	});
	//console.log((req.AV.user).get('nickname'));
    						
});

router.get('/create', function(req, res, next) {
  var nickName=req.body.nickName;
  var ticket;
  var groupclass = new GroupClass();
  fs.readFile(path.join(__dirname,'../config/ticket.txt'), 'utf8', function (err, txt) {
			if((new Date().getTime()) < (JSON.parse(txt).expireTime)){
				ticket = JSON.parse(txt).ticket;
				var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/group/create?username='+req.query.username);
				console.log('not exoired'+ticket);
				res.render('group_create', {
					//title: 'Groups 列表',
					username: req.query.username,
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
					fs.writeFile(path.join(__dirname,'../config/ticket.txt'), JSON.stringify(results), function(){
							console.log('ticket expire time'+results.expireTime);
							var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/group/create?username='+req.query.username);
							//console.log('.............'+jsapi.nonceStr);
							res.render('group_create', {
								//title: 'Groups 列表',
								username: req.query.username,
								nonceStr: jsapi.nonceStr,
								timestamp: jsapi.timestamp,
								signature: jsapi.signature
								//groups: results
							});
					});
	
				});
		
			}
			
  });

});

// 新增 Group
router.post('/create', function(req, res, next) {
  var nickName=req.body.nickName;
  var groupColor = req.body.groupColor;
  var username=req.query.username;
  var flagImg = req.body.flagImg;
  var serverId = req.body.serverId;
  console.log("serverid="+serverId+' flagImg='+flagImg); 
  var groupclass = new GroupClass();
  console.log('color'+groupColor);
  groupclass.create(flagImg,serverId,groupColor,nickName,username,function(err,group){
     if(flagImg === '1'){
	api.getLatestToken(function(){
			
		});
	api.getMedia(serverId, function (err, data, res) {
             console.log(data);
             fs.writeFile('test.jpg',data,function(err){});
             var file = new AV.File(serverId, data,res.headers['content-type']);
             file.save().then(function(file){
                //console.log('上传成功！'+file.getObjectId());
                 //res.send('uploadchenggong');
		group.set('headImgFile',file);
		group.set('groupHeadImgUrl',file.url());
	     	group.set('groupHeadImgUrl',file.url());
		group.set('groupHeadImgUrlHomePage',file.thumbnailURL(640,480));
		group.set('groupHeadImgUrlSearchPage',file.thumbnailURL(64,64));	
		group.save().then(function(){
		});	
		//res.redirect('/group/createSet?username='+req.query.username+'&groupObjId='+group.getObjectId());
             });
 	});
     }else{
	//group.set('serverId',serverId);
	group.set('groupHeadImgUrl',serverId);
	group.set('groupHeadImgUrlHomePage',serverId);
	group.set('groupHeadImgUrlSearchPage',serverId);
	group.save().then(function(){
		//res.redirect('/group/createSet?username='+req.query.username+'&groupObjId='+group.getObjectId());

	});
     }	
	res.redirect('/group/createSet?username='+req.query.username+'&groupObjId='+group.getObjectId());
 });
	
});

router.get('/createSet', function(req, res, next) {
  console.log('get createset');
  res.render('group_set', {
          username: req.query.username,
	         groupObjId:req.query.groupObjId
    });

});
router.post('/createSet', function(req, res, next) {
	var pushMsg2Wechat=req.body.pushMsg2Wechat;
  var identityVerify=req.body.identityVerify;
  //var groupColor = req.body.groupColor;
	var username = req.query.username;
  console.log('post...'+username);
	var groupObjId = req.query.groupObjId;
  console.log("post ....."+groupObjId);
	console.log('push'+pushMsg2Wechat+'iden'+identityVerify);
	var groupclass = new GroupClass();
 	groupclass.groupSet(groupObjId,pushMsg2Wechat,identityVerify);
});


router.get('/search',function(req,res,next){
  var searchString=req.query.searchString;
  var username = req.query.username;
  var recommandOrNot = req.query.recommandOrNot; 
  var groupclass = new GroupClass();
  var querys = new AV.SearchQuery(Group);
  console.log('fjdkla;');
    if(recommandOrNot==='0'){
	console.log(searchString);
    	if(searchString === 'all'){
         	 querys.queryString('*');
    	}
   	    else {
        	querys.queryString(searchString+'~3');
        	//querys.queryString('nickname:'+'['+searchString+']');
  	   }
    	querys.find().then(function(results) {
      	console.log('Found %d objects', querys.hits());
      	//Process results
      	if(results.length===0){
			res.render('group_search', {
          	//title: 'Groups 列表',
          	username: req.query.username,
          	groups: results
            });
		}else{
			groupclass.groupQuery(results,function(err,finalGroups){
				console.log('final');
				res.render('group_search', {
				//title: 'Groups 列表',
				username: req.query.username,
				groups: finalGroups
				});
			});
	     }   
    	}); 
    }
    else{
   	querys.queryString('*');
 	querys.find().then(function(results) {
        console.log('Found %d objects', querys.hits());
        //console.log(results);
        //Process results
        if(results.length===0){
			res.render('group_search', {
          	//title: 'Groups 列表',
          	username: req.query.username,
          	groups: results
            });
		}else{
			groupclass.groupQuery(results,function(err,finalGroups){
				console.log('final');
				res.render('group_search', {
				//title: 'Groups 列表',
				username: req.query.username,
				groups: finalGroups
				});
			});
	     }
    });


   }

})
//查询群
router.post('/search',function(req,res,next){
 	var searchString=req.body.targetGroup;
	var username = req.query.username;
  	res.redirect('/group/search?username='+req.query.username+'&searchString='+searchString+'&recommandOrNot=0');

})

//加入群
router.post('/joinGroup',function(req,res,next){
	var username = req.body.username;
	var groupObjIdJoined = req.body.groupObjIdJoined;
	var groupclass = new GroupClass();
  username = username.trim();
	console.log('get into join group');
  console.log('joined group'+ groupObjIdJoined);
  console.log('joined group username'+username);
	groupclass.joinGroup(groupObjIdJoined,username,function(err,queryUser){
		var query = new AV.Query(Group);
	    query.get(groupObjIdJoined,{
			 success:function(group){
					var followersNum = group.get('followersNum');
						followersNum ++;
						group.set('followersNum',followersNum);
					var relation = group.relation('followers');
					relation.add(queryUser);
					group.save().then(function(group){
						res.redirect('/group/search?username='+username);
					},function(err){});;

			 },
			  error:function(error){
			 }
	    });
	});      //添加群成员 
	//groupclass.joinGroup(groupObjId,username);       //在用户groupJoined添加群信息
})


module.exports = router;
