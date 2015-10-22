var AV = require('leanengine');
var Group=AV.Object.extend('Group');

function GroupClass()
{
	this.create = function(flagImg,serverId,groupColor,nickname,username,cb){
		var group=new Group();
		var promise = new AV.Promise();
		group.set('nickname',nickname);
		group.set('createdBy',username);
		group.set('groupColor',groupColor);
		group.set('flagImg',flagImg);
		group.set('serverId',serverId);
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
				var groupJoinedNum = queryUser.get('groupJoinedNum');
				groupJoinedNum ++;
				//var whichGroupNow = queryUser.get('whichGroupNow');
				//if(whichGroupNow == '0'){
					queryUser.set('whichGroupNow',group.getObjectId());
					queryUser.set('whichGroupNameNow',nickname);
				//}
				queryUser.set('groupJoinedNum',groupJoinedNum);
				var relationUser = queryUser.relation('groupCreated');
				relationUser.add(group);
				queryUser.save().then(function(obj) {
  				//对象保存成功
					cb(null,group);
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
		console.log('jaqunzhe...'+username);
  		//query.equalTo('nickname', groupName);
  		query.get(groupObjId,{
  			success: function(group) {
  				console.log('jiaru de qun'+group.get('nickname'));
				var queryUser = new AV.Query(AV.User);
				queryUser.equalTo("username",username);
				queryUser.first({
					success:function(queryUser){
						var groupJoinedNum = queryUser.get('groupJoinedNum');
						groupJoinedNum ++;
						queryUser.set('groupJoinedNum',groupJoinedNum);
						queryUser.set('whichGroupNow',group.getObjectId());
						queryUser.set('whichGroupNameNow',group.get('nickname'));
						console.log('加群者是：'+queryUser.get('nickname'));
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
	/*
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

    };  */
    this.groupQuery = function(groups,cb){
		var j=0;
		var reQueryGroup = new Array();
        for(var i=0 ; i< groups.length;i++){
			(function(i){
			groupObjId = groups[i].getObjectId();
			console.log('requery'+groupObjId);
			var query = new AV.Query(Group);
			query.get(groupObjId,{
				success: function(group) {
					reQueryGroup[i]=group;
					j++;
					console.log('requery'+group.get('nickname'));
					if(j===groups.length)
					{
							cb(null,reQueryGroup);
					}
				},
				error: function(object, error) {
				  
				}
			});
		   })(i);
	     }
    };
    this.groupSwitch = function(username,whichGroupNow,whichGroupNameNow,cb){
		 var queryUser = new AV.Query(AV.User);
        queryUser.equalTo("username",username);
        queryUser.first({
            success:function(queryUser){
                   queryUser.set('whichGroupNow',whichGroupNow);
				   queryUser.set('whichGroupNameNow',whichGroupNameNow);
				   queryUser.save().then(function(user){
					    cb(null,user);
				   });
            },
            error:function(error){
            }
        });
		
	};

};
module.exports = GroupClass;
