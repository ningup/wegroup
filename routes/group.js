var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js
var UserClass = require('../common/user_class.js'); 

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
    						
});

router.get('/create', function(req, res, next) {
  var nickName=req.body.nickName;
  var groupclass = new GroupClass();
  console.log(req.query.username);
  res.render('group_create', {
          //title: 'Groups 列表',
          username: req.query.username,
          //groups: results
    });

   //res.redirect('/group?username='+req.query.username+'&searchString='+searchString);
});

// 新增 Group
router.post('/create', function(req, res, next) {
  var nickName=req.body.nickName;
  var username=req.query.username; 
  var groupclass = new GroupClass();
  //console.log(req.query.username);
  groupclass.create(nickName,username,function(err,groupObjId){

	res.redirect('/group/createSet?username='+req.query.username+'&groupObjId='+groupObjId);
 });
	
});

router.get('/createSet', function(req, res, next) {
  res.render('group_set', {
          username: req.query.username,
	  groupObjId:req.query.groupObjId
    });

});
router.post('/createSet', function(req, res, next) {
	var pushMsg2Wechat=req.body.pushMsg2Wechat;
        var identityVerify=req.body.identityVerify;
	var username = req.query.username;
	var groupObjId = req.query.groupObjId;
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

  //groupclass.addFollower(groupName,req.query.username); //添加群成员 
  //groupclass.joinGroup(groupName,req.query.username);  //在用户groupJoined添加群信息
    //res.redirect('/group?username='+req.query.username+'&searchString='+searchString);

})
//查询群
router.post('/search',function(req,res,next){
 	var searchString=req.body.targetGroup;
	var username = req.query.username;
	//var groupclass = new GroupClass();
	//groupclass.addFollower(groupName,req.query.username); //添加群成员 
	//groupclass.joinGroup(groupName,req.query.username);  //在用户groupJoined添加群信息
  	res.redirect('/group/search?username='+req.query.username+'&searchString='+searchString+'recommandOrNot==0');

})

module.exports = router;
