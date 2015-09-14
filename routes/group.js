var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js


//声明类对象的时候，要先设置App的applicationId,applicationKey, 有待验证
//AV.initialize('DKHKFtC7GKQ73o88sUgyEEON','vjB7pWwwzSYaaze1nrgwXYWL');

//声明一个Group类，为避免堆栈溢出，放到全局变量里面
var Group = AV.Object.extend('Group');

// 搜索 Groups 结果
router.get('/', function(req, res, next) {
  var querys = new AV.SearchQuery(Group);
  var searchString = req.query.searchString;
   if(searchString === 'all'){
  	querys.queryString('*');
   }
   else {
	querys.queryString('*'+searchString+'*');
   }
  querys.find().then(function(results) {
    console.log('Found %d objects', querys.hits());
    //Process results
    res.render('group', {
        title: 'Groups 列表',
        username: req.query.username,
        groups: results
      });

  });
});

// 新增 Group
router.post('/create', function(req, res, next) {
  var nickName=req.body.nickName;
  var groupclass = new GroupClass();
  var searchString = 'all';
  console.log(req.query.username);
  groupclass.create(nickName,req.query.username);       //调用groupclass的建群函数 
 // res.redirect('/group?username='+req.query.username);
  //res.redirect('/group?username='+req.query.username+'&searchString=all');
   res.redirect('/group?username='+req.query.username+'&searchString='+searchString);
})


//查询群
router.post('/follow',function(req,res,next){
 	var searchString=req.body.targetGroup;
	var username = req.query.username;
	var groupclass = new GroupClass();

	//groupclass.addFollower(groupName,req.query.username); //添加群成员 
	//groupclass.joinGroup(groupName,req.query.username);  //在用户groupJoined添加群信息
  	res.redirect('/group?username='+req.query.username+'&searchString='+searchString);

})

module.exports = router;
