var router = require('express').Router();
var AV = require('leanengine');

router.get('/', function(req, res, next) {
	res.render('lyh_test1', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/topic', function(req, res, next){
	res.render('lyh_test_topic', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/publish', function(req, res, next){
	res.render('lyh_test_publish', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/vote', function(req, res, next){

	res.render('lyh_test_vote', {
          title: 'TODO 列表',
          todos: []
        });
});

router.post('/vote', function(req, res, next){
	
	var gg = req.body.choiceTitle;
	var qq = req.body.voteDecription;
	var ss = req.body.type;
	console.log(gg);
	console.log(qq);
	console.log(ss);	

	res.render('lyh_test_vote', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/votepublish', function(req, res, next){
	res.render('lyh_test_votepublish', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/file', function(req, res, next){
	res.render('lyh_test_file', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/band', function(req, res, next){
	res.render('lyh_test_band', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/feed', function(req, res, next){
	res.render('lyh_test_feed', {
          title: 'TODO 列表',
          todos: []
        });
});

router.get('/replyall', function(req, res, next){
	res.render('lyh_test_replyall', {
          title: 'TODO 列表',
          todos: []
        });
});

module.exports = router;