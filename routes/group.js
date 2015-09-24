var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var UserClass = require('../common/user_class.js'); 
var sign=require('../common/sign.js');
var WechatAPI = require('wechat-api');
var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
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
  var groupclass = new GroupClass();
  AV.Cloud.httpRequest({
  url: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx88cb5d33bbbe9e75&secret=77aa757e3bf312d9af6e6f05cb01de1c',
  /*params: {
    q : 'Sean Plott'
  },*/
  success: function(httpResponse) {
    //console.log(JSON.parse(httpResponse.text).access_token);
        AV.Cloud.httpRequest({
        url: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket',
        params: {
          access_token: JSON.parse(httpResponse.text).access_token,
          type:'jsapi'
        },
        success: function(httpResponse1) {
          //console.log(JSON.parse(httpResponse1.text).ticket);
          var ticket=JSON.parse(httpResponse1.text).ticket;
          var jsapi=sign(ticket, 'http://dev.wctest.avosapps.com/group/create?username='+req.query.username);
          console.log('.............'+jsapi.nonceStr);
          res.render('group_create', {
                //title: 'Groups 列表',
                username: req.query.username,
                nonceStr: jsapi.nonceStr,
                timestamp: jsapi.timestamp,
                signature: jsapi.signature
                //groups: results
          });

        },
        error: function(httpResponse) {
          console.error('Request failed with response code ' + httpResponse.status);
        }
      });
  },
  error: function(httpResponse) {
    console.error('Request failed with response code ' + httpResponse.status);
  }
});
  //console.log('create'+(req.AV.user).get('nickname'));

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

	api.getMedia(serverId, function (err, data, res) {
             console.log(data);
             //fs.writeFile('test.jpg',data,function(err){});
             var file = new AV.File(serverId+'.jpg', data);
             file.save().then(function(file){
                //console.log('上传成功！'+file.getObjectId());
                 //res.send('uploadchenggong');
		group.set('headImgFile',file);
		group.set('groupHeadImgUrl',file.url());
		group.save().then(function(){
		//var id = group.getObjectId();
		//res.redirect('/group/createSet?username='+req.query.username+'&groupObjId='+id);
		});	
		//res.redirect('/group/createSet?username='+req.query.username+'&groupObjId='+group.getObjectId());
             });
 	});
     }else{
	//group.set('serverId',serverId);
	group.set('groupHeadImgUrl',serverId);
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
  var searchString=req.query.targetGroup;
  var username = req.query.username;
  var recommandOrNot = req.query.recommandOrNot; 
  //var groupclass = new GroupClass();
  var querys = new AV.SearchQuery(Group);
    if(recommandOrNot==='0'){
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
      	res.render('group_serach', {
          	//title: 'Groups 列表',
          	username: req.query.username,
          	groups: results
            });

    	});
    }
    else{
   	querys.queryString('*');
 	querys.find().then(function(results) {
        console.log('Found %d objects', querys.hits());
        //Process results
        res.render('group_search', {
                //title: 'Groups 列表',
                username: req.query.username,
                groups: results
            });

        });


   }

})
//查询群
router.post('/search',function(req,res,next){
 	var searchString=req.body.targetGroup;
	var username = req.query.username;
  	res.redirect('/group/search?username='+req.query.username+'&searchString='+searchString+'recommandOrNot==0');

})

//加入群
router.get('/joinGroup',function(req,res,next){
	var username = req.query.username;
	var groupObjId = req.query.groupObjId;
	var groupclass = new GroupClass();
	groupclass.addFollower(groupObjId,username,function(err,queryUser){
		var query = new AV.Query(Group);
	    query.get(groupObjId,{
			 success:function(group){
					var relation = group.relation('followers');
					relation.add(queryUser);
					group.save().then(function(group){
						//res.redirect('/group/search?username='+username);
					},function(err){});;

			 },
			  error:function(error){
			 }
	    });
	});      //添加群成员 
	//groupclass.joinGroup(groupObjId,username);       //在用户groupJoined添加群信息
})



module.exports = router;
