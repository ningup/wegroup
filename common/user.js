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
}
module.exports = userFollowed;
