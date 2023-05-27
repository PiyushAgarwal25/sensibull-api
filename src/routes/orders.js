const express = require("express");
const router = express.Router();
const axios = require('axios');
const ordermodel = require("../models/order");
const cron = require("node-cron");
const impFunc = require("../utilites/order");
router.use(express.json());


cron.schedule('*/15 * * * * *', async () => {
    console.log("cron job working");
    try{
        await impFunc.cronJob();
    }catch(err){
        console.log("cron job error");
    }
});


// to place order
router.post("/order-service",async(req,res)=>{
    let order_tag = "mystocks"
    let {quantity=0,symbol=""} = req.body;
    const url = `${process.env.URL}/api/v1/order/place`;

    const headers = {
    'X-AUTH-TOKEN': process.env.TOKEN,
    'Content-Type': 'application/json',
    };

    const body = {symbol,quantity,order_tag};

    try {
        const response = await axios.post(url, body, { headers });
        let x = response.data.payload.order;
        let order = {
            identifier:x.order_id,
            symbol:x.symbol,
            quantity:x.request_quantity,
            filled_quantity:x.filled_quantity,
            order_status:x.status
        }
        let neworder = new ordermodel(order);
        await neworder.save();
        res.status(200).send({
            success:response.data.success,
            payload:order,
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({error:"there was an error"});
    }
});



// to modify order
router.patch("/order-service",async(req,res)=>{
    const {quantity=0,identifier=""} = req.body;
    try {
        // first we will check the status of the order in our db
        let status = await impFunc.toGetOrderStatus(identifier);
        // console.log("status::",status);
        if(!status){
            return res.status(200).send({
                success:"success",
                msg:"this order can't be update now",
            });
        }

        // then we will found out if order can we modified with the latest update
        let canModify = await impFunc.toModifyAnOrder(identifier,quantity);
        // console.log("canModify :",canModify);
        if(canModify===2){
            return res.status(200).send({
                msg:"the requested quantity cannot be modified bcoz it's already filled",
            })
        }

        res.status(200).send(canModify);
    } catch (error) {
        // console.log("error while modification processs");
        res.status(400).send({error:"there was error while modifying this order"});
    }
});

// cancel order
router.delete("/order-service",async(req,res)=>{
    const {identifier=0} = req.body;
    try {
        // first we will check the status of the order in our db
        let status = await impFunc.toGetOrderStatus(identifier);
        // console.log("status::",status);
        if(!status){
            return res.status(200).send({
                success:"success",
                msg:"this order can't be cancelled now",
            });
        }

        let canDelete = await impFunc.toDeleteOrder(identifier);
        // console.log("canModify :",canDelete);
        if(canDelete===2){
            return res.status(200).send({
                msg:"Order cannot be cancelled",
            })
        }
        res.status(200).send(canDelete);
    } catch (error) {
        console.log(error);
        res.status(400).send("there was error while deleting process");
    }
});

// fetch order status
router.post("/order-service/status",async(req,res)=>{
    let {identifier} = req.body;
    try {  
        let order =  await ordermodel.findOne({identifier});
        // console.log("value of order is ",order);
        if(!order){
            res.status(401).send({error:"you have no order available with this ids"});
            return;
        }  
        res.status(200).send({
            sucess:true,
            payload:{
                identifier:order.identifier,
                symbol:order.symbol,
                quantity:order.quantity,
                filled_quantity:order.filled_quantity,
                order_status:order.order_status
            }
        })
    } catch (error) {
        // console.log(error);
        res.status(400).send({error:"there was error while fetching the status of the above order"})
    }
});

module.exports = router;