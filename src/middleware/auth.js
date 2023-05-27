const jwt = require("jsonwebtoken");
const userModel = require("../models/user.js");

const auth = async (req,res,next)=>{
    try {
        const token = req.header("Authorization").replace("Bearer ","");
        const decoded = jwt.verify(token,process.env.SECRET_KEY);
        const user = await userModel.userModel.findOne({_id:decoded._id,"tokens.token":token});
        if(!user){
            throw new Error();
        }
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send({error:"Authentication Failed!"})
    }
}

module.exports = auth;