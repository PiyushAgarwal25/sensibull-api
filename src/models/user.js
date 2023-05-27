const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        uppercase:true,
    },
    email:{
        type:String,
        unique:true,
        trim:true,
        lowercase:true,
        required:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("email is unvalid!");
            }
        }
    },
    password:{
        type:String,
        required:true,
        trim:true,
    },
    tokens:[{
        token:{
            type:String,
            required:true,
        }
    }]
})

userSchema.methods.validatePassword = function(){
    const user = this;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if(!passwordRegex.test(user.password)){
        throw new Error("password did'nt satisfy criteria");
    }
}

userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = await jwt.sign({_id:user._id.toString()},process.env.SECRET_KEY);
    user.tokens = user.tokens.concat({token});
    await user.save({validateBeforeSave:false});
    return token;
};

userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
}

userSchema.pre('save',async function(next) {
    const user = this;
    try {
      if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8);
      }
      next();
    } catch (error) {
      next(error);
    }
});

function validateDocument(document) {
    const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    return schema.validate(document);
}

userSchema.statics.findByCredentials = async (email,password)=>{
    const user = await userModel.findOne({email});
    if(!user){
        throw new Error("unable to login");
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        throw new Error("unable to login");
    }
    return user;
}

const userModel = new mongoose.model("user",userSchema);

module.exports = {
    userModel,
    validateDocument
}