const asyncHandler = require("express-async-handler");
const {User} = require("../models/User")
const {Category , validateCreateCategory} = require("../models/Category");

/**--------------------------------------
 * @desc Create New Category
 * @route /api/categorys
 * @method POST
 * @access private (only Admin)
 *-------------------------------------*/
module.exports.createCategoryCtrl = asyncHandler(async(req,res)=>{
    const{error}= validateCreateCategory(req.body);
    if(error){
        return res.status(400).json({message:error.details[0].message });
    }
    const category = await Category.create({
        title:req.body.title,
        user: req.user.id
    });

    res.status(201).json(category);
})

/**--------------------------------------
 * @desc Get All Category
 * @route /api/categories
 * @method GET
 * @access public 
 *-------------------------------------*/
module.exports.getAllCategorysCtrl = asyncHandler(async(req,res)=>{
    const categorys = await Category.find();
    res.status(200).json(categorys);
});

/**--------------------------------------
 * @desc Delete Category
 * @route /api/categorys/:id
 * @method DELETE
 * @access private (only admin) 
 *-------------------------------------*/
module.exports.DeleteCategoryCtrl = asyncHandler(async(req,res)=>{
    const category = await Category.findById(req.params.id);
    if(!category){
        return res.status(404).json({message: " category Not found"});
    }
    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({message: "category has been deleted successfully" , categoryId: category._id });
    
});