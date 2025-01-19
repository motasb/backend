const mongoose = require("mongoose");
const joi = require("joi");

const CommentSchema = new mongoose.Schema({
    postId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text:{
        type:String,
        required: true,
    },
    username:{
        type:String,
        required: true,
    },    
},{timestamps:true})

// 'Comment model'
const Comment = mongoose.model("Comment" , CommentSchema);

// validate Create Comment
function validateCreateComment(obj){
    const Schema = joi.object({
        postId: joi.string().required().label("Post ID"),
        text: joi.string().trim().required().max(30000),
    })
    return Schema.validate(obj);
}

// validate Update Comment
function validateUpdateComment(obj){
    const Schema = joi.object({
        text: joi.string().trim().required().max(30000),
    })
    return Schema.validate(obj);
}

module.exports = {
    Comment,
    validateCreateComment,
    validateUpdateComment,
}