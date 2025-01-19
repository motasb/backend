const Joi = require("joi");
const mongoose = require("mongoose");
const passwordComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");

// User Schema
const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    email:{
        type:String,
        required: true,
        trim: true,
        minlength: 5,
        maxlength: 100,
        unique: true,
    },
    password:{
        type:String,
        required: true,
        trim: true,
        minlength: 8,
    },
    profilePhoto:{
        type:Object,
        default:{
            url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png",
            publicId:null,
        }
    },
    bio:{
        type:String,
    },
    isAdmin:{
        type:Boolean,
        default: false,
    },
    isAccountVerified:{
        type:Boolean,
        default: false,
    },
},{
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
})
// populate Posts that belongs to this user when he/she get his/her profile
UserSchema.virtual("posts" , {
    ref: "Post",
    foreignField: "user",
    localField: "_id",
})

// Generate Auth Token 
UserSchema.methods.generateAuthToken = function(){
    return jwt.sign({id: this._id , isAdmin: this.isAdmin } , process.env.JWT_SECRET);
}

// User modal
const User = mongoose.model("User" , UserSchema);

// validate Register User
function validateRegisterUser(obj){
    const Schema = Joi.object({
        username: Joi.string().trim().min(2).max(100).required(),
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: passwordComplexity().required() ,
    });
    return Schema.validate(obj);
} 

// validate Login User
function validateLoginUser(obj){
    const Schema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
        password: passwordComplexity().required(),
    });
    return Schema.validate(obj);
}

// validate Update User
function validateUpdateUser(obj){
    const Schema = Joi.object({
        username: Joi.string().trim().min(2).max(100),
        password: passwordComplexity(),
        bio: Joi.string(),
    });
    return Schema.validate(obj);
}

// validate Email
function validateEmail(obj){
    const Schema = Joi.object({
        email: Joi.string().trim().min(5).max(100).required().email(),
    });
    return Schema.validate(obj);
}

// validate New Password User
function validateNewPassword(obj){
    const Schema = Joi.object({
        password: passwordComplexity().required(),
    });
    return Schema.validate(obj);
}

module.exports = {
    User,
    validateRegisterUser,
    validateLoginUser,
    validateUpdateUser,
    validateEmail,
    validateNewPassword,
}