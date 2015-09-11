# wegroup
利用 wechat，wechat-api package
### feature       written by NingLi
user 相关功能 
1.把目前已关注的用户加入user数据库
2.已关注的用户的关注/取消动作 导致'subscribe'的值变化
3.新关注的用户会注册到数据库
4.加入Oauth认证功能

###new feature
加入group相关功能
1.用户建群，影响字段：User/groupCreated ,Group/所有
2.用户加群，影响字段：User/groupJoined, Group/followers

###user数据表
uid: "leancloud中用户唯一的id",
openid: "微信中用户唯一的id"，
username: "与openid相同，不可更改",
nickname: "默认与微信相同，可更改"
password: "初始默认密码A00000000~",
headimgurl: "用户头像url",
sex: "性别 1男2女",
country: "国家",
province: "省";
city: "城市",
subscribe: "是否关注 1关注2没关注",
subscribeTime: "关注时间即注册时间"
groupCreated: "创建的群",
groupJoined: "参加其他人的群（不包括自己创建的群）"

###group数据表
createdBy: "创建者username"
nickname:  "群名称"
followers  "群成员"
nicknameOfCUser: "创建者nickname"
pushMsg2wechat: "是否推送至公众号"
identityVerify: "加群者是否需要群主同意" 

### 文件组织
app.js			主文件，中间件的使用，路由的分配，微信公众号的事件处理
common/user_class.js    用户相关的类文件
common/group_class.js   群相关的类文件
public			放置静态文件
routes/user.js		user路由文件
routes/group.js		group路由文件
cloud.js		云代码文件
config/menu.js		自定义菜单文件
views/group.ejs		模板文件		
views/index.ejs		-------
view/user.ejs		-------
###开发相关
1.注意微信调用接口次数限制问题，此版本不加以考虑，因为用户较少。
2.leancloud部署环境里，写文件操作失败，本地部署可以写入成功。
3.目前加入群没有考虑群名字相同的情况
4.用户目前可以加入自己的建立的群，需要考虑。
#bug
1.必须利用 wechat 原始代码接入，否则失败。
2.自定义菜单bug，时不时变化到一个固定的情况。
