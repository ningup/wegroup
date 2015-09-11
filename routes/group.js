var router = require('express').Router();
var AV = require('leanengine');
var GroupClass = require('../common/group_class.js'); //引入group_class.js


//声明类对象的时候，要先设置App的applicationId,applicationKey, 有待验证
//AV.initialize('DKHKFtC7GKQ73o88sUgyEEON','vjB7pWwwzSYaaze1nrgwXYWL');

//声明一个Group类，为避免堆栈溢出，放到全局变量里面
var Group = AV.Object.extend('Group');

// 查询 Groups 列表	
router.get('/', function(req, res, next) {

  var query = new AV.Query(Group);
  query.descending('createdAt');
  query.find({
    success: function(results) {
      res.render('group', {
        title: 'Groups 列表',
	username: req.query.username,
        groups: results
      });
    },
    error: function(err) {
      if (err.code === 101) {
        // 该错误的信息为：{ code: 101, message: 'Class or object doesn\'t exists.' }，说明 Todo 数据表还未创建，所以返回空的 Todo 列表。
          res.render('group', {
	  title: 'Groups 列表',
          groups: []
        });
      } else {
        next(err);
      }
    }
  });
});

// 新增 Group
router.post('/create', function(req, res, next) {
  var nickName=req.body.nickName;
  var groupclass = new GroupClass();
  console.log(req.query.username);
  groupclass.create(nickName,req.query.username);       //调用groupclass的建群函数 
  res.redirect('/group?username='+req.query.username);
})


//用户加入群
router.post('/follow',function(req,res,next){
 	var groupName=req.body.targetGroup;
	var username = req.query.username;
	var groupclass = new GroupClass();
	groupclass.addFollower(groupName,req.query.username); //添加群成员 
	groupclass.joinGroup(groupName,req.query.username);  //在用户groupJoined添加群信息
  	res.redirect('/group?username='+req.query.username);

})

module.exports = router;
