var AV = require('leanengine');
var Group=AV.Object.extend('Group');

function GroupClass()
{
	this.create = function(groupColor,nickname,username,cb){
		var group=new Group();
		var promise = new AV.Promise();
		group.set('nickname',nickname);
          	group.set('createdBy',username);
          	group.set('groupColor',groupColor);
		var query = new AV.Query(AV.User);
                query.equalTo("username", username);
                query.first({
                   success: function(queryUser) {
			var relation = group.relation('followers');
                   	relation.add(queryUser);
			group.set('nicknameOfCUser',queryUser.get('nickname'));
			group.save(null,{
			success:function(group)
			{
				var relationUser = queryUser.relation('groupCreated');
				relationUser.add(group);
				//var promise = new AV.Promise();       
                                //promise.resolve(group);
                                //return promise;

				queryUser.save().then(function(obj) {
  				//对象保存成功
					cb(null,group.getObjectId());
					//var promise = new AV.Promise();	
   					 //promise.resolve(group);
 					 //return promise;

				}, function(error) {
				  //对象保存失败，处理 error
				});	
							
			},
			error: function(group,err){
			
			}
		        });
		   },
                   error: function(error) {
                   }});
		
	};
	this.groupSet = function(groupObjId,pushMsg2Wechat,identityVerify){
		var query = new AV.Query(Group);
		console.log(groupObjId);
		query.get(groupObjId, {
  		success: function(group) {
    		// 成功获得实例
			console.log('find group in groupSet');
			group.set('pushMsg2Wechat',pushMsg2Wechat);
			group.set('identityVerify',identityVerify);
			//group.set('groupColor',groupColor);
			group.save();
  		},
  		error: function(object, error) {
		//console.log('find group in groupSet');
    		// 失败了.
  		}
      });
   }; 
	this.joinGroup = function(groupObjId,username,cb){
		var query = new AV.Query(Group);
  		//query.equalTo('nickname', groupName);
  		query.get(groupObjId,{
  			success: function(group) {
				var queryUser = new AV.Query(AV.User);
				queryUser.equalTo("username",username);
				queryUser.first({
					success:function(queryUser){
						var relationUser = queryUser.relation('groupJoined');
                                		relationUser.add(group);
						queryUser.save().then(function(user){
							cb(null,user);
						},function(err){});
					},
					error:function(error){
					}
				});
  			},
  			error: function(object, error) {
  			}
  		});		
	};
     this.addFollower = function(groupObjId,username,cb){
        var queryUser = new AV.Query(AV.User);
        queryUser.equalTo("username",username);
        queryUser.first({
            success:function(queryUser){
                   var query = new AV.Query(Group);
                    query.equalTo("nickname",groupName);
                     query.first({
                         success:function(group){
                                var relation = group.relation('followers');
                                relation.add(queryUser);
                                group.save();

                         },
                          error:function(error){
                         }
                         });

            },
            error:function(error){
            }
        });

    };

};
module.exports = GroupClass;
