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
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"user"
    }
},
{ strict: 'throw',timestamps:true},
);

orderSchmea.methods.toJSON = function(){
    const order = this;
    const orderObject = order.toObject();

    delete orderObject.owner;
    delete orderObject.__v;
    delete orderObject["createdAt"];
    delete orderObject["updatedAt"];
    delete orderObject["_id"];
    return orderObject;
}

const orderModel = new mongoose.model("order",orderSchmea);

module.exports = orderModel;