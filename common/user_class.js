var AV = require('leanengine');
var WechatAPI = require('wechat-api');
var api = new WechatAPI('wx88cb5d33bbbe9e75', '77aa757e3bf312d9af6e6f05cb01de1c');
function userFollowed()
{
    var count;
    this.followedUserRegister = function(){
      api.getFollowers(function (err, data, resf){
        count = data.count;
         api.batchGetUsers(data.data.openid, function (err, datalist, res){
	    for(var i=0 ; i < count ; i++){
                //console.log(datalist.user_info_list[i].nickname);	     
             var user = new AV.User();
	     user.set("username", datalist.user_info_list[i].openid);
	     user.set("password", "A00000000~");

	     // other fields can be set just like with AV.Object
	     user.set("openid", datalist.user_info_list[i].openid);
             user.set("nickname", datalist.user_info_list[i].nickname);
	     user.set("sex", datalist.user_info_list[i].sex);
	     user.set("headimgurl", datalist.user_info_list[i].headimgurl);
	     user.set("subscribe", datalist.user_info_list[i].subscribe);
	     user.set("country", datalist.user_info_list[i].country);
	     user.set("province", datalist.user_info_list[i].province);
	     user.set("city", datalist.user_info_list[i].city);
	     user.signUp(null, {
		success: function(user) {
    		// 注册成功，可以使用了.
  		},
  		error: function(user, error) {
    		// 失败了
    			//alert("Error: " + error.code + " " + error.message);
  		}			
	     });	     

           }
                            
         });
      });
    }
    this.config_lastAccessTime = function(username){
		var lastAccessTime = new Object();
		lastAccessTime.time = new Array();
		var queryUser = new AV.Query(AV.User);
		queryUser.equalTo("username",username);
		queryUser.first({
			success:function(queryUser){
				console.log('find user'+ queryUser.get('nickname'));
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
						lastAccessTime.time[i] = new Object() ;
						lastAccessTime.time[i].gid = object.getObjectId();
						lastAccessTime.time[i].time = object.getCreatedAt();
						j++;
					}
					var relationJ = queryUser.relation("groupJoined");
					relationJ.targetClassName = 'Group';
					var queryJ = relationJ.query();
					queryJ.find({
					  success: function(resultsJ) {
						for (i = 0; i < resultsJ.length; i++) {
						  var objectJ = resultsJ[i];
						  console.log('find relation group:'+ objectJ.get('nickname')+ '创建者是:' +objectJ.get('nicknameOfCUser'));
							lastAccessTime.time[j] = new Object() ;
							lastAccessTime.time[j].gid = objectJ.getObjectId();
							lastAccessTime.time[j].time = objectJ.getCreatedAt();
							j++;
							if(j===(resultsJ.length+results.length))
							{
								console.log(lastAccessTime);
								queryUser.set('lastAccessTime',lastAccessTime);
								queryUser.save();
							}
							
						}
						}});
					
					
				  },
				  error: function(error) {	
				  }
				});
				
				
				
			},
			error:function(error){
				
			}
		});

	}; 
}
module.exports = userFollowed;
