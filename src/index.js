const express = require("express");
const app = express();
const orders = require("./routes/orders");
const users = require("./routes/users");
const connectToMongo = require("./db/mongoose");
const orderModel = require("./models/order");
const { userModel } = require("./models/user");

connectToMongo();

app.use("/",orders);
app.use("/api/users",users);

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`App started at Port:${PORT}`)
})


























// const main = async()=>{
//     const order = await orderModel.findById("64758ce9e3d7d9bb2de0bfef");
//     await order.populate("owner");
//     console.log(order.owner);

//     const user = await userModel.findById("64758a423cae3f95d76b419a");
//     await user.populate("orders");
//     console.log(user.orders); 
// }

// main();


