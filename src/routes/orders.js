const express = require("express");
const router = express.Router();
const ordermodel = require("../models/order");
const orderHelper = require("../Helpers/order");
const cron = require("node-cron");
const auth = require('../middleware/auth');
const myConstant = require("../constant");
const { createErrorObject } = require("../controllers/order");


router.use(express.json());


cron.schedule('*/15 * * * * *', async () => {
    console.log("cron job working");
    try{
        await orderHelper.cronJob();
    }catch(err){
        console.log("cron job error");
    }
});


// to place order
router.post("/order-service",auth,async(req,res)=>{
    const body = {...req.body,order_tag:process.env.ORDER_TAG,id:req.user._id};
    try {
        const response = await orderHelper.placeOrder(body);
        res.status(response.statusCode).send(response);
    } catch (error) {
        if(error.statusCode){
            res.status(error.statusCode).send(error);
            return;
        }
        res.status(500).
        send(createErrorObject(myConstant.statusCode["HTTP_ISE"],null,myConstant.message.error["INT_SER_ERROR"],null))
    }
});



// to modify order
router.patch("/order-service",auth,async(req,res)=>{
    const {quantity=0,identifier=""} = req.body;
    try {
        let response = await orderHelper.modifyOrder({quantity,identifier});
        res.status(response.statusCode).send(response);
    } catch (err) {
        let statusCode = err.statusCode?err.statusCode:myConstant.statusCode["HTTP_BAD-REQUEST"];
        let error = err.error?err.error:myConstant.message.error["ERR_MODIFY_ORDER"];
        res.status(statusCode).
        send(createErrorObject(statusCode,null,error,null));
    }
});

//========================================>> cancel order
router.delete("/order-service",auth,async(req,res)=>{
    const {identifier=0} = req.body;
    try {
        let response = await orderHelper.toDeleteOrder(identifier);
        res.status(response.statusCode).send(response);
    } catch (err) {
        console.log(err);
        let statusCode = err.statusCode?err.statusCode:myConstant.statusCode["HTTP_BAD-REQUEST"];
        let error = err.error?err.error:myConstant.message.error["ERR_DELETE_ORDER"];
        res.status(statusCode).
        send(createErrorObject(statusCode,null,error,null));
    }
});

//===================================>> fetch order status
router.post("/order-service/status",auth,async(req,res)=>{
    let {identifier} = req.body;
    try {  
        let response = await orderHelper.getStatusOfOrder(identifier);
        res.status(myConstant.statusCode["HTTP_SUCCESS"]).send(response);
    } catch (error) {
        console.log(error);
        res.status(error.statusCode).send(error);
    }
});

//=====================================>> fetching all the orders of a particular USER
router.get("/getOrders",auth,async(req,res)=>{
    try {
        await req.user.populate({
            path:'orders'
        })
        res.status(200).send(createErrorObject(
        myConstant.statusCode["HTTP_SUCCESS"],true,null,req.user.orders));
    } catch (error) {
        console.log(error);
        res.status(500).send(
            createErrorObject(myConstant.statusCode["HTTP_ISE"],null,myConstant.message.error["INT_SER_ERROR"],null));
    }
})



module.exports = router;