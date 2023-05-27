const mongoose = require("mongoose");


const orderSchmea = mongoose.Schema({
    identifier:{
        type:String,
        required:true,
    },
    symbol:{
        type:String,
        required:true,
    },
    quantity:{
        type:Number,
        required:true,
    },
    filled_quantity:{
        type:Number,
        required:true,
    },
    order_status:{
        type:String,
        required:true,
    }
});

const orderModel = new mongoose.model("order",orderSchmea);

module.exports = orderModel;