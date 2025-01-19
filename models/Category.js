const mongoose = require("mongoose");
const joi = require("joi");

const CategorySchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title:{
        type:String,
        required: true,
        trim: true,
    }, 
},{timestamps:true})

// 'Category model'
const Category = mongoose.model("Category" , CategorySchema);

// validate Create Comment
function validateCreateCategory(obj){
    const Schema = joi.object({
        title: joi.string().trim().required().max(30000),
    })
    return Schema.validate(obj);
};

module.exports = {
    Category,
    validateCreateCategory,
}