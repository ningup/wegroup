var AV = require('leanengine');
var Group=AV.Object.extend('Group');
var GroupAlbum = AV.Object.extend('GroupAlbum');
var WechatAPI = require('wechat-api');
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
function GroupAlbumClass()
{
	this.createAlbum = function(groupObjId,username,albumName,cb){
		var groupalbum = new GroupAlbum();
		groupalbum.set('createdBy', username);
		groupalbum.set('inWhichGroup', groupObjId);
		groupalbum.set('albumName', albumName);
		groupalbum.save().then(function(groupalbum){
				var queryG = new AV.Query(Group);
				queryG.get(groupObjId, {
					success: function(group) {
						// 成功获得实例
						//console.log("found the "+group.get('nickname'));
						var relation = group.relation('groupAlbum');
						relation.add(groupalbum);
						group.save();
						
					},
					error: function(feed, error) {
						// 失败了.
					}
					});
				
		});
		var queryUser = new AV.Query(AV.User);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				feed.set('nicknameOfCUser',queryUser.get('nickname'));
				feed.save().then(function(feed){
						cb();
					});
				
			},
			error:function(error){
				
			}
		});
		
	};
	this.upload = function(groupAlbumObjId,username,serverId,cb){
		var photosArray = new Array();
		var query = new AV.Query(GroupAlbum);
		query.get(groupAlbumObjId, {
		  success: function(groupalbum) {
			  photosArray = groupalbum.get('photosArray');
			  var length = photosArray.length;
			  var j=0;
			  for(var i=photosArray.length ; i< (photosArray.length+serverId.length); i++){
					(function(i){
							api.getLatestToken(function(){});
						api.getMedia(serverId[i], function (err, imgData, res) {
							var feedimgfile = new AV.File('test.jpg', imgData);  //,res.headers['content-type']);
							feedimgfile.save().then(function(feedimgfile){
							photosArray[i] = new Object();	
							photosArray[i].username = username;
							photosArray[i].url = feedimgfile.url();
							photosArray[i].urlSmall = feedimgfile.thumbnailURL(640,480);
							j++;
							if(j===(photosArray.length+serverId.length))
							{
						
								var queryUser = new AV.Query(AV.User);
								queryUser.equalTo("username",username);
								queryUser.first({
								success:function(queryUser){
									    for(var m=length ; m< (length+serverId.length); m++ ){
											(function(m){
												photosArray[m].nickname = queryUser.get('nickname');
												groupalbum.set('photosArray',photosArray);
												groupalbum.save().then(function(groupalbum){
													cb();
												});
											})(m);
											
										}
									},
									error:function(error){
										
									}
								});
							}
						});

					 });
						
					
					})(i);
		      
		      }

		  },
		  error: function(object, error) {
		
		  }
		});
	};
	this.removePhotos = function(feedObjId,username){
		
	};
	this.removeAlbum = function(feedObjId,username){
		
	};

};
module.exports = GroupAlbumClass;
