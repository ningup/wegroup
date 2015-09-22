var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js


//声明类对象的时候，要先设置App的applicationId,applicationKey, 有待验证
//AV.initialize('DKHKFtC7GKQ73o88sUgyEEON','vjB7pWwwzSYaaze1nrgwXYWL');

//声明一个Group类，为避免堆栈溢出，放到全局变量里面
var Group = AV.Object.extend('Group');

// 搜索 Groups 结果
router.get('/', function(req, res, next) {
		var queryUser = new AV.Query(AV.User);
    		username = req.query.username;
		console.log('username'+username);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				console.log('find '+ queryUser.get('nickname'));
				var relation = queryUser.relation("groupCreated");
				relation.targetClassName = 'Group';
				var query = relation.query();
				//query.equalTo('nickname','北交大');
				query.find({
				  success: function(results) {
					  var i = 0;
					  var j=0;
					for (i = 0; i < results.length; i++) {
					  var object = results[i];
					  console.log('find relation group:'+ object.get('nickname')+ '创建者是:' +object.get('nicknameOfCUser'));
						j++;
					}
					var relationJ = queryUser.relation("groupJoined");
					relationJ.targetClassName = 'Group';
					var queryJ = relationJ.query();
					queryJ.find({
					  success: function(resultsJ) {
						for (i = 0; i < resultsJ.length; i++) {
						  var objectJ = resultsJ[i];
						  results[j] = objectJ
						  console.log('find relation group:'+ objectJ.get('nickname')+ '创建者是:' +objectJ.get('nicknameOfCUser'));
							j++;					
						}
						res.render('group', {
					        //title: 'Groups 列表',
        					username: req.query.username,
        					groups: results
      						});
	
						}});
		
				  },
				  error: function(error) {	
				  }
				});
		
				
			},
			error:function(error){
				
			}
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
