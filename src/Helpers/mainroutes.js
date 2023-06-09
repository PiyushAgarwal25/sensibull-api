const orderHelper = require("../Helpers/order");
const myConstant = require("../constant");
const { createErrorObject } = require("../controllers/order");
const logger = require("../logs/devlogging");



const placeMyOrder = async(req,res)=>{
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
}


const modifyMyOrder = async(req,res)=>{
    const {quantity=0,identifier=""} = req.body;
    try {
        let response = await orderHelper.modifyOrder({quantity,identifier});
        res.status(response.statusCode).send(response);
    } catch (err) {
        logger.error("err in patch route:",err);
        let statusCode = err.statusCode?err.statusCode:myConstant.statusCode["HTTP_BAD-REQUEST"];
        let error = err.error?err.error:myConstant.message.error["ERR_MODIFY_ORDER"];
        res.status(statusCode).
        send(createErrorObject(statusCode,null,error,null));
    }
}

const deleteMyOrder = async(req,res)=>{
    const {identifier=0} = req.body;
    try {
        let response = await orderHelper.toDeleteOrder(identifier);
        res.status(response.statusCode).send(response);
    } catch (err) {
        logger.error(err);
        let statusCode = err.statusCode?err.statusCode:myConstant.statusCode["HTTP_BAD-REQUEST"];
        let error = err.error?err.error:myConstant.message.error["ERR_DELETE_ORDER"];
        res.status(statusCode).
        send(createErrorObject(statusCode,null,error,null));
    }
}

const fetchMyOrder = async(req,res)=>{
    let {identifier} = req.body;
    try {  
        let response = await orderHelper.getStatusOfOrder(identifier);
        res.status(myConstant.statusCode["HTTP_SUCCESS"]).send(response);
    } catch (error) {
        logger.error(error);
        res.status(error.statusCode).send(error);
    }
}

const getMyAllOrder = async(req,res)=>{
    try {
        await req.user.populate({
            path:'orders'
        })
        res.status(200).send(createErrorObject(
        myConstant.statusCode["HTTP_SUCCESS"],true,null,req.user.orders));
    } catch (error) {
        logger.error(error);
        res.status(500).send(
            createErrorObject(myConstant.statusCode["HTTP_ISE"],null,myConstant.message.error["INT_SER_ERROR"],null));
    }
}

module.exports={
    placeMyOrder,
    modifyMyOrder,
    deleteMyOrder,
    fetchMyOrder,
    getMyAllOrder
}