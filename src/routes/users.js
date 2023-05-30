const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.js");
const { createMyUser, getMyUser, logMyUser, logoutMyUser, logoutAllMyUser, updateMyUser } = require("../Helpers/user");

router.use(express.json());


// to create user
router.post("/",createMyUser);

//====================for getting user
router.get("/me",auth,getMyUser);

//====================for logging user
router.post("/login",logMyUser);

//===================for logging out
router.post("/logout",auth,logoutMyUser);

router.post("/logoutAll",auth,logoutAllMyUser);

//======================updating the user
router.patch("/me",auth,updateMyUser);

module.exports = router;