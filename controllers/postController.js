const fs = require("fs");
const path = require("path");
const asyncHandler = require("express-async-handler");
const {Post, validateCreatePost, validateUpdatePost } = require("../models/Post");
const {Comment} = require("../models/Comment");
const { cloudinaryUploadImage , cloudinaryRemoveImage} = require("../utils/cloudinary");

/**--------------------------------------
 * @desc Create New Post
 * @route /api/posts
 * @method POST
 * @access private (only logged in User)
 *-------------------------------------*/
module.exports.createPostCtrl = asyncHandler(async(req,res)=>{
    if(!req.file){
        return res.status(400).json({message: "no image provided"});
    }

    const {error} = validateCreatePost(req.body);
    if(error){
        return res.status(400).json({message: error.details[0].message});
    }

    const imagePath = path.join(__dirname , `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);

    const post = await Post.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        user: req.user.id,
        image: {
            url: result.secure_url,
            publicId: result.public_id,
        }
    });

    res.status(201).json(post);

    fs.unlinkSync(imagePath);
});

/**--------------------------------------
 * @desc Get All Posts
 * @route /api/posts
 * @method GET
 * @access public 
 *-------------------------------------*/
module.exports.getAllPostsCtrl = asyncHandler(async(req,res)=>{
    const POST_PER_PAGE = 3;
    const {pageNumber , category } = req.query;
    let posts;

    if(pageNumber){
        posts = await Post.find()
            .skip((pageNumber - 1) * POST_PER_PAGE)
            .limit(POST_PER_PAGE)
            .sort({createdAt: -1})
            .populate("user" , ["-password"]);
    }else if(category){
        posts = await Post.find({category})
            .sort({createdAt: -1})
            .populate("user" , ["-password"]);
    }else{
        posts = await Post.find().sort({createdAt: -1})
            .populate("user" , ["-password"]);
    }
    res.status(200).json(posts);
})

/**--------------------------------------
 * @desc Get Single Post
 * @route /api/posts/:id
 * @method GET
 * @access public 
 *-------------------------------------*/
module.exports.getSinglePostCtrl = asyncHandler(async(req,res)=>{
    const post = await Post.findById(req.params.id)
    .populate("user" , ["-password"])
    .populate("comments");
    if(!post){
        return res.status(404).json({message: " post not found"});
    }
    res.status(200).json(post);
})

/**--------------------------------------
 * @desc Get Post Count
 * @route /api/posts/count
 * @method GET
 * @access public 
 *-------------------------------------*/
module.exports.getPostCountCtrl = asyncHandler(async(req,res)=>{
    const post = await Post.estimatedDocumentCount();

    res.status(200).json(post);
});

/**--------------------------------------
 * @desc Delete Post
 * @route /api/posts/:id
 * @method DELETE
 * @access private (only admin or owner of the post) 
 *-------------------------------------*/
module.exports.deletePostCtrl = asyncHandler(async(req,res)=>{
    const post = await Post.findById(req.params.id)
    if(!post){
        return res.status(404).json({message: " post not found"});
    }
    if(req.user.isAdmin || req.user.id === post.user.toString()){
        await Post.findByIdAndDelete(req.params.id);
        await cloudinaryRemoveImage(post.image.publicId);

        await Comment.deleteMany({postId: post._id});

        res.status(200).json({message: "post has been deleted succussfully" , postId: post._id , } )
    }else{
        res.status(403).json({message: "access denied , forbidden"});
    }
});

/**--------------------------------------
 * @desc Update Post
 * @route /api/posts/:id
 * @method PUT
 * @access private (only owner of the post) 
 *-------------------------------------*/
module.exports.updatePostCtrl = asyncHandler(async(req,res)=>{
    const {error} = validateUpdatePost(req.body);
    if(error){
        return res.status(400).json({message: error.details[0].message});
    }

    const post = await Post.findById(req.params.id);
    if(!post){
        return res.status(404).json({message: " post not found"});
    }

    if(req.user.id !== post.user.toString()){
        return res.status(403).json({message:"access denied, you are not allowed"});
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id , {
        $set:{
            title:req.body.title,
            description: req.body.description,
            category:req.body.category,
        }
    }, {new: true}).populate("user" , ["-password"])
    .populate("comments");
    
    res.status(200).json(updatedPost);
})

/**--------------------------------------
 * @desc Update Post Image
 * @route /api/posts/update-image/:id
 * @method PUT
 * @access private (only owner of the post) 
 *-------------------------------------*/
module.exports.updatePostImageCtrl = asyncHandler(async(req,res)=>{
    if(!req.file){
        return res.status(400).json({message: "No image Provided"});
    }

    const post = await Post.findById(req.params.id);
    if(!post){
        return res.status(404).json({message: " post not found"});
    }

    if(req.user.id !== post.user.toString()){
        return res.status(403).json({message:"access denied, you are not allowed"});
    }

    await cloudinaryRemoveImage(post.image.publicId);

    const imagePath = path.join(__dirname , `../images/${req.file.filename}`);
    const result  = await cloudinaryUploadImage(imagePath);
    
    const updatedPost = await Post.findByIdAndUpdate(req.params.id , {
        $set:{
            image:{
                url: result.secure_url,
                publicId: result.public_id,
            }
        }
    }, {new: true})
    res.status(200).json(updatedPost);
    
    fs.unlinkSync(imagePath);
})

/**--------------------------------------
 * @desc Toggle Like
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (only Logged in User) 
 *-------------------------------------*/
module.exports.toggleLikeCtrl = asyncHandler(async(req,res)=>{
    const loggedInUser = req.user.id;
    const {id:postId} = req.params

    let post = await Post.findById(postId);
    if(!post){
        return res.status(404).json({message: " post Not found"});
    }
    const isPostAlreadyLiked = post.likes.find((user)=>user.toString() === loggedInUser)
    if(isPostAlreadyLiked){
        post = await Post.findByIdAndUpdate(postId , {
            $pull:{
                likes: loggedInUser
            }
        },{new:true});
    }else{
        post = await Post.findByIdAndUpdate(postId , {
            $push:{
                likes: loggedInUser
            }
        },{new:true});
    }
    res.status(200).json(post);
});