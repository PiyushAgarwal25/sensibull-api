const express = require("express");
const router = express.Router();
const userModel = require("../models/user");
const auth = require("../middleware/auth.js");

router.use(express.json());


// to create user
router.post("/",async(req,res)=>{
    try {
        const result = userModel.validateDocument(req.body);
        if(result.error){
            res.status(400).json({error:"Can't create user with above details!"});
            return;
        }
        const data = new userModel.userModel(result.value);
        await data.validatePassword();
        await data.save();
    
        const token = await data.generateAuthToken();
        res.status(201).json({data,token});
        
    } catch (error) {
        res.status(400).json({error:"there was error while creating user"});
    }
})

//====================for getting user
router.get("/me",auth,async(req,res)=>{
    res.status(200).send(req.user);
})

//====================for logging user
router.post("/login",async(req,res)=>{
    let {email=0,password=0}= req.body;
    try {
        let user = await userModel.userModel.findByCredentials(email,password);
        let token = await user.generateAuthToken();
        res.status(200).send({user,token});
    } catch (error) {
        res.status(400).send({error:"there was error while login In !"});
    }
})

//===================for logging out
router.post("/logout",auth,async (req,res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token;
        });
        await req.user.save({ validateBeforeSave: false });
        res.status(200).send("successfully logged out !");
    } catch (error) {
        res.status(500).send({error:"server error!"});
    }
})

router.post("/logoutAll",auth,async (req,res)=>{
    try {
        req.user.tokens = [];
        await req.user.save({ validateBeforeSave: false });
        res.status(200).send("successfully logged out !");
    } catch (error) {
        res.status(500).send({error:"server error!"});
    }
})

//======================updating the user
router.patch("/me",auth,async(req,res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name","email","password"];
    const isValidOperation = updates.every(i=>allowedUpdates.includes(i));

    if(!isValidOperation){
        res.status(400).send({error:"Invalid updates !"});
        return;
    }
    try {
        if(typeof req.body.name === "number"){
            res.status(400).send({error:"name cannot be number"});
            return;
        }
        Object.keys(req.body).forEach((i)=>{
            if(req.user[i]){
                req.user[i] = req.body[i];
            }
        });
        if(req.body.password){
            await req.user.validatePassword();
        }
        await req.user.save();
        res.status(200).send(req.user);
    } 
    catch (error) {
        res.status(400).json({error:"There was error while updating process"});
      }
});

module.exports = router;