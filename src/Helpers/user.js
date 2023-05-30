const logger = require("../logs/devlogging");
const userModel = require("../models/user");

const createMyUser = async(req,res)=>{
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
        // console.log(error);
        logger.error(error);
        res.status(400).json({error:"there was error while creating user"});
    }
};

const getMyUser = async(req,res)=>{
    res.status(200).send(req.user);
};

const logMyUser = async(req,res)=>{
    let {email=0,password=0}= req.body;
    try {
        let user = await userModel.userModel.findByCredentials(email,password);
        let token = await user.generateAuthToken();
        res.status(200).send({user,token});
    } catch (error) {
        console.log(error);
        res.status(400).send({error:"there was error while login In !"});
    }
}

const logoutMyUser = async (req,res)=>{
    try {
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token;
        });
        await req.user.save({ validateBeforeSave: false });
        res.status(200).send("successfully logged out !");
    } catch (error) {
        res.status(500).send({error:"server error!"});
    }
};

const logoutAllMyUser = async (req,res)=>{
    try {
        req.user.tokens = [];
        await req.user.save({ validateBeforeSave: false });
        res.status(200).send("successfully logged out !");
    } catch (error) {
        res.status(500).send({error:"server error!"});
    }
}

const updateMyUser = async(req,res)=>{
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
};

module.exports={
    createMyUser,
    getMyUser,
    logMyUser,
    logoutMyUser,
    logoutAllMyUser,
    updateMyUser   
}