# wegroup 1.1
利用 wechat，wechat-api package

### new feature
加入user 相关功能
user数据表

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

#weixin 接入bug
必须利用 wechat 原始代码接入，否则失败。
