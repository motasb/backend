const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {User , validateEmail , validateNewPassword } = require("../models/User");
const VerificationToken = require("../models/VerificationToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

/**--------------------------------------
 * @desc Send Reset Password Link
 * @route /api/password/reset-password-link
 * @method POST
 * @access public
 *-------------------------------------*/
module.exports.sendResetPasswordLinkCtrl = asyncHandler(async(req,res)=>{
    // 1.validation
    const {error} = validateEmail(req.body);
    if(error){
        res.status(400).json({message:error.details[0].message});
    }
    // 2.get the user from db by email
    const user = await User.findOne({email: req.body.email});
    if(!user){
        return res.status(404).json({message: "User with given email does not exist!"})
    }
    // 3.creating verificationToken
    let verificationToken = await VerificationToken.findOne({userId: user._id});
    if(!verificationToken){
        verificationToken = new VerificationToken({
            userId:user._id,
            token: crypto.randomBytes(32).toString("hex"),
        });
        await verificationToken.save();
    }
    // 4.creating link 
    const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verificationToken.token}`;
    // 5.creating html template
    const htmlTemplate = `<a href="${link}">Click here to reset your password</a>`
    // 6.sending email
    await sendEmail(user.email , "Reset Password" , htmlTemplate);
    // 7.response to the client
    res.status(200).json({message:"Password Reset Link Sent To Your Email , Please Check Your inbox"});
})

/**--------------------------------------
 * @desc get Reset Password Link
 * @route /api/password/reset-password/:userId/:token
 * @method GET
 * @access public
 *-------------------------------------*/
module.exports.getResetPasswordLinkCtrl = asyncHandler(async(req,res)=>{
    const user = await User.findById(req.params.userId);
    if(!user){
        return res.status(400).json({message:"invalid Link"});
    }
    const verificationToken = await VerificationToken.findOne({
        userId: user._id,
        token: req.params.token,
    })
    if(!verificationToken){
        return res.status(400).json({message:"invalid Link"});
    }
    res.status(200).json({message:"valid url"});
})

/**--------------------------------------
 * @desc Reset Password Link
 * @route /api/password/reset-password/:userId/:token
 * @method POST
 * @access public
 *-------------------------------------*/
module.exports.ResetPasswordLinkCtrl = asyncHandler(async(req,res)=>{
    const {error} = validateNewPassword(req.body);
    if(error){
        res.status(400).json({message:error.details[0].message});
    }

    const user = await User.findById(req.params.userId);
    if(!user){
        return res.status(400).json({message: "invalid Link"})
    }
    const verificationToken = await VerificationToken.findOne({
        userId: user._id,
        token: req.params.token,
    })
    if(!verificationToken){
        return res.status(400).json({message:"invalid Link"});
    }

    if(!user.isAccountVerified){
        user.isAccountVerified = true;
    }

    const salt  = await bcrypt.genSalt(10);
    const hasedPassword = await bcrypt.hash(req.body.password , salt);

    user.password = hasedPassword;
    await user.save();
    await verificationToken.deleteOne();

    res.status(200).json({message: "Password reset successfully, please log in "});

})