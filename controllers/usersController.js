const asyncHandler = require("express-async-handler");
const {User, validateUpdateUser} = require("../models/User");
const {Post} = require("../models/Post")
const {Comment} = require("../models/Comment")
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const { cloudinaryUploadImage , cloudinaryRemoveImage, cloudinaryRemoveMultipleImage} = require("../utils/cloudinary");

/**--------------------------------------
 * @desc Get All Users Profile
 * @route /api/users/prfoile
 * @method GET
 * @access private (only admin)
 *-------------------------------------*/

module.exports.getAllUsersCtrl = asyncHandler(async(req ,res)=>{
    const users = await User.find().select("-password").populate("posts");
    res.status(200).json(users);
});

/**--------------------------------------
 * @desc Get User Profile
 * @route /api/users/prfoile/:id
 * @method GET
 * @access public
 *-------------------------------------*/

module.exports.getUserProfileCtrl = asyncHandler(async(req ,res)=>{
    const user = await User.findById(req.params.id).select("-password").populate("posts");
    if(!user){
        return res.status(404).json({message: "User Not found"});
    }
    res.status(200).json(user);
});

/**--------------------------------------
 * @desc Update User Profile
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (onlu User himself)
 *-------------------------------------*/
module.exports.updateUserProfileCtrl = asyncHandler(async(req,res)=>{
    const {error} = validateUpdateUser(req.body);
    if(error){
        return res.status(400).json({message:error.details[0].message});
    }

    if(req.body.password){
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(req.body.password , salt);
    }
    const updatedUser = await User.findByIdAndUpdate(req.params.id , {
        $set:{
            username: req.body.username,
            password: req.body.password,
            bio: req.body.bio,
        }
    }, {new : true}).select("-password")
    .populate("posts");

    res.status(200).json(updatedUser);

})

/**--------------------------------------
 * @desc Get Users Count 
 * @route /api/users/Count
 * @method GET
 * @access private (only admin)
 *-------------------------------------*/

module.exports.getUsersCountCtrl = asyncHandler(async(req ,res)=>{
    const count = await User.estimatedDocumentCount();
    res.status(200).json(count);
});

/**--------------------------------------
 * @desc Profile Photo Upload 
 * @route /api/users/profile/profile-photo-upload
 * @method POST
 * @access private (only Logged in user)
 *-------------------------------------*/

module.exports.profilePhotoUploadCtrl = asyncHandler(async(req,res)=>{
    if(!req.file){
        return res.status(400).json({message:"no file Provided"})
    }

    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

    const result = await cloudinaryUploadImage(imagePath);
    console.log(result);

    const user = await User.findById(req.user.id);
    if(user.profilePhoto.publicId !== null){
        await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }

    user.profilePhoto = {
        url: result.secure_url,
        publicId: result.public_id,
    }

    await user.save();

    res.status(200).json({message:"your profile photo uploaded successfully" , 
        profilePhoto: {url: result.secure_url , publicId: result.public_id}
    });

    fs.unlinkSync(imagePath); 
});

/**--------------------------------------
 * @desc Delete User Profile (Account)
 * @route /api/users/profile/:id
 * @method DELETE
 * @access private (only admin or user user himself)
 *-------------------------------------*/

module.exports.deleteUserProfileCtrl = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.params.id);
    if(!user){
        return res.status(404).json({message: " your cant delete"})
    }
    
    const posts = await Post.find({user: user._id});
    
    const publicIds = posts?.map((post) => post.image.publicId );
    
    if(publicIds?.length > 0){
        await cloudinaryRemoveMultipleImage(publicIds);
    }
    if(user.profilePhoto.publicId !== null){
        await cloudinaryRemoveImage(user.profilePhoto.publicId);
    }
    
    await Post.deleteMany({user: user._id});
    await Comment.deleteMany({user: user._id});
    
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({message: "your Profile has been deleted"});
})