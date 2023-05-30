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
});


userSchema.virtual("orders",{
    ref:'order',
    localField:'_id',
    foreignField:'owner',
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
    console.log(user);
    try {
      if(user.isModified('password')){
        const saltRounds = 10;
        // const salt = await bcrypt.genSalt(saltRounds);
        const saltedPassword = process.env.PEPPER_F + user.password + process.env.PEPPER_L;
        console.log(saltedPassword);
        user.password = await bcrypt.hash(saltedPassword, saltRounds);
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
    console.log(password);
    if(!user){
        throw new Error("unable to login");
    }
    const saltedPassword = process.env.PEPPER_F + password + process.env.PEPPER_L;
    console.log(saltedPassword);
    const isMatch = await bcrypt.compare(saltedPassword,user.password);
    console.log(isMatch);
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