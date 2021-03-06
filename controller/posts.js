const Posts = require('../models/posts');
const Users = require('../models/users');
const { hasSuccess, hasError  } = require('../responseHandle');

const posts = {
    get: async (req, res, next)=>{
        const { sort, keyword } = req.query;
        let filter = keyword ? { content: new RegExp(`${keyword}`)} : {};
        let sortby = sort === 'asc' ? { createAt: 1 } : { createAt: -1 };
        // console.log(filter, sortby)
        const data = await Posts.find(filter).sort(sortby).populate({
            path: 'user', // 設定 schema 的欄位名稱
            select: 'userName userPhoto' // 要顯示的欄位資訊
        })
        // console.log(data);
        hasSuccess(res, 200, data);
    },
    post: async (req, res, next) => {
        // 待新增需驗證的資訊
        const data = req.body;
        if(!data.user || !data.content){
            // console.log(data.user, data.content)
            const errMsg = '資料格式錯誤';
            return next( hasError(400, errMsg, next) )
        }
        const hasUser = await Users.findById(data.user).exec() // 如果找不到就是 null
        // console.log(hasUser);
        if( hasUser ){
            const newData = await Posts.create(data);
            const allData = await Posts.find().populate({
                path: 'user',
                select: 'userName userPhoto'
            });
            hasSuccess(res, 200, { newData, allData });
        } else {
            const errMsg = '找不到使用者';
            return next( hasError(400, errMsg, next) )
        }
    },
    deleteMany:  async (req, res, next) => {
        if(req.originalUrl.startsWith("/posts/")){
            const errMsg = 'API錯誤，或未填寫ID，未刪除任何資料。';
            return next( hasError(404, errMsg, next) )
        }
        const result = await Posts.deleteMany({});
        // console.log(typeof(result.deletedCount))
        let msg = '';
        if( !result.deletedCount ) {
            msg = `資料庫已無貼文`;
        } else {
            msg = `共刪除 ${ result.deletedCount }筆資料`;
        }
        hasSuccess(res, 200, { msg })
    },
    deleteOne: async (req, res, next)=>{
            const result = await Posts.findByIdAndDelete(req.params.id);
            if(result == null){
                const errMsg =  '查無此筆資料！';
                return next( hasError(404, errMsg, next) )
            }
            hasSuccess(res, 200, result);
    },
    update: async (req, res, next)=>{
        const option = {
            new: true,
            runValidators: true
        }
        const data = req.body;
        if(data.content.trim().length === 0 ) {
            const errMsg = 'content不可為空';
            return next( hasError(400, errMsg, next) )
        } else {
            const { tags, type, image, content } = await Posts.findByIdAndUpdate(req.params.id, data, option);
            const result = { tags, type, image, content };
            if( result != null){
                hasSuccess(res, 200, result)
            } else {
                const errMsg = '資料修改失敗，或無此筆資料!';
                return next( hasError(400, errMsg, next) )
            }
        }
    }
}

module.exports = posts;
