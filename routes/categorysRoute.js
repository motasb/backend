const router = require("express").Router();
const { createCategoryCtrl, getAllCategorysCtrl, DeleteCategoryCtrl } = require("../controllers/categorysController");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");


// api/categories/
router.route("/")
.post(verifyTokenAndAdmin , createCategoryCtrl)
.get(getAllCategorysCtrl);

// api/categories/:id
router.route("/:id")
    .delete(validateObjectId , verifyTokenAndAdmin , DeleteCategoryCtrl);

module.exports = router;