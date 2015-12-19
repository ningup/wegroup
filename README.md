# wegroup band
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
加入feed相关功能
1.用户在某个group下发布文字feed
加入评论和点赞功能
1.对某一条feed点赞
2.对某一条feed评论
###user数据表
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
groupCreated: "创建的群 relation",
groupJoined: "参加其他人的群（不包括自己创建的群） relation"

###group数据表
createdBy: "创建者username"
nickname:  "群名称"
followers:  "群成员 relation"
nicknameOfCUser: "创建者nickname"
feedPosted: "群feed relation"
pushMsg2wechat: "是否推送至公众号"
identityVerify: "加群者是否需要群主同意" 

###feed数据表
postedBy: "发布者者username"
inWhichGroup:  "feed所在群"
feedType:  "feed类型"
nicknameOfPUser: "发布者nickname"
feedContent: "feed文字内容"
feedImg: "feed图片 relation"
feedComment: "feed评论 relation"
likeNum:  "点赞数"
likeUsers: "点赞的用户 relation"

###comment数据表
who:	"评论者"
toWhom: "被评论者"
inWhichFeed: "评论所在feed"
content: "评论内容"

### 文件组织
app.js			主文件，中间件的使用，路由的分配，微信公众号的事件处理
common/user_class.js    user相关的类文件
common/group_class.js   group相关的类文件
common/feed_class.js    feed相关的类文件
common/comment_class.js comment相关的类文件
common/like_class.js    like相关的类文件
public			放置静态文件
routes/user.js		user路由文件
routes/group.js		group路由文件
routes/feed.js          feed路由文件
routes/comment.js       comment路由文件
cloud.js		云代码文件
config/menu.js		自定义菜单文件
views/group.ejs		模板文件		
views/index.ejs		-------
view/user.ejs		-------
view/feed.ejs           -------

###开发相关
#1.本版本全局维护accessToken(注：oath的accessToken没有考虑)。
2.尽量选用数据库存数据，leancloud读写文件有bug，怀疑是读出来的字符串有多余字符。
#3.群名字可以相同
#4.用户目前可以加入自己的建立的群，需要考虑。
5.退群，删除feed，删除comment 没有实现。
6.公众号发送信息有字符限制。 (推送用户所有的群，还没有考虑这一点， 群数限制)
#7.判断用户是否关注
#8.feed图片压缩
9.feed图片类型的限制
10.群头像更换次数限制
11.连续发帖（评论）次数限制
#bug
1.必须利用 wechat 原始代码接入，否则失败，偶尔复现。
2.自定义菜单bug，偶尔复现。
3.feed加载更多　会加载重复的（偶尔复现）。
