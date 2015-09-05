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
                console.log(datalist.user_info_list[i].nickname+'\n');	           		
             }
             	     


                            
         });
      });
    } 
}
module.exports = userFollowed;
