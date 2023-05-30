const axios = require('axios');
const myConstant = require("../constant");
const ordermodel = require("../models/order");
const {createErrorObject,axiosRequest} = require("../controllers/order");
const logger = require("../logs/devlogging");
const cron = require("node-cron");


const headers = {
    'Content-Type': 'application/json',
    'X-AUTH-TOKEN': process.env.TOKEN,
}

const callCronJob = ()=>{
    cron.schedule('*/15 * * * * *', async () => {
        // console.log("cron job working");
        logger.info("cron job working");
        try{
            await cronJob();
        }catch(err){
            logger.error("cron job error");
        }
    });
}

const toGetOrderStatus = async(identifier)=>{
    // console.log(identifier);
    logger.info(identifier);
    try {
        const order = await ordermodel.findOne({identifier});
        // console.log(order);
        logger.info(order);
        if(!order){
            throw createErrorObject(myConstant.statusCode["HTTP_BAD-REQUEST"],null,myConstant.message.error["ID_ERROR"],null);
        }
        if(!order.order_status==="open"){
            throw createErrorObject(myConstant.statusCode["HTTP_BAD-REQUEST"],null,myConstant.message.error["DELETE_ORDER"],null);
        }

        // return order.order_status;
    } catch (error) {
        // console.log("error in toGetOrderStatus");
        logger.error("error in toGetOrderStatus");
        throw createErrorObject(myConstant.statusCode["HTTP_ISE"],null,myConstant.message.error["INT_SER_ERROR"],null);
    }
}


const toUpdateAnOrder = async (id,newResponse)=>{
    // console.log("toupdateanorder");
    // console.log("this is the id:",id,newResponse);
    logger.info("toupdateanorder");
    logger.info("this is the id:",id,newResponse);

    try {
            let updatedOrder = await ordermodel.findOneAndUpdate({identifier:id},
                {
                    order_status:newResponse.status,
                    filled_quantity:newResponse.filled_quantity,
                    quantity:newResponse.request_quantity
                },
                {new:true}
                )
            // console.log(updatedOrder);
            return updatedOrder;
    } catch (error) {
        logger.error("there was error while changing the orderStatues.")
        throw createErrorObject(myConstant.statusCode["HTTP_ISE"],null,myConstant.message.error["INT_SER_ERROR"],null);
    }
}

const toUpdateOrders = async (orders,newResponse)=>{
    try {
        // will find the order with the order_id and then update the order
        orders.forEach(async (element,i) => {
            let updatedOrder = await ordermodel.findOneAndUpdate({identifier:element},
                {
                    order_status:newResponse[i].status,
                    filled_quantity:newResponse[i].filled_quantity,
                },
                {new:true}
                )
            // console.log(updatedOrder);
        });
    } catch (error) {
        // console.log(error);
        // console.log("to update orders");
        logger.error("to update order",error);
    }
}


//========================Cron job function

const cronJob = async ()=>{
    // fetching all the orders with open status from db
    let orders = await ordermodel.find({order_status:"open"},"identifier");
    let fetchorders = orders.map((b)=>{
        return b.identifier;
    });

    try {
        const response = await axiosRequest("POST",{order_ids:fetchorders},headers,"status-for-ids");
        // will update the order's statues and also change the amount of filled quantity
        toUpdateOrders(fetchorders,response.payload);
    } catch (error) {
        // console.log("cron JOB function");  
        logger.error("cron JOB function ")   
    }
}




//============================>> helper function to place order
const placeOrder = async(body)=>{
    const requriedKeys = ["quantity","symbol","order_tag","id"];
    let bodyKeys = Object.keys(body);
    let updateKeys = bodyKeys.every(i=>{
        return requriedKeys.includes(i);
    });
    if(!updateKeys){
        throw createErrorObject(myConstant.statusCode["HTTP_BAD-REQUEST"],null,myConstant.message.error["INPUT_ERROR"],null);
    }
    try {
        const response = await axiosRequest("POST",body,headers,"place");
        let orderField = response.payload.order; 
        let order = {
            identifier: orderField.order_id,
            symbol: orderField.symbol,
            quantity: orderField.request_quantity,
            filled_quantity: orderField.filled_quantity,
            order_status: orderField.status,
            owner:body.id
        }
        let neworder = new ordermodel(order);
        await neworder.save();
        return createErrorObject(myConstant.statusCode["HTTP_SUCCESS"],myConstant.message.success["PLACE_ORDER"],null,order);

    } catch (error) {
        // console.log("placeORder",error);
        logger.error("placeORder",error);
        if(error.statusCode){
            return createErrorObject(error.statusCode,null,error.error,null);
        }
        return createErrorObject(myConstant.statusCode["HTTP_BAD-REQUEST"],null,myConstant.message.error["ERR_PLACE_ORDER"],null);
    }
}

//============================>> to modify error
const modifyOrder = async(body)=>{
    try {
        // first we get status from our db
        await toGetOrderStatus(body.identifier);

        // then we will make request to SENSIBULL MODIFY API
        const response = await axiosRequest("PUT",{quantity:body.quantity},headers,body.identifier);
        if(!response.payload){
            throw createErrorObject(myConstant.statusCode["HTTP_BAD-REQUEST"],null,myConstant.message.error["REQUESTED_QUANTITY"],null);
        }
        let updateDocs = await toUpdateAnOrder(body.identifier,response.payload.order);
        let {identifier,symbol,quantity,filled_quantity,order_status} = updateDocs;

        return createErrorObject(myConstant.statusCode["HTTP_SUCCESS"],myConstant.message.success["MODIFY_ORDER"],null,{identifier,quantity,symbol,filled_quantity,order_status});

    } catch (error) {
        logger.error(error);
        throw {
            statusCode:error.statusCode?error.statusCode:500,
            success:null,
            payload:null,
            error:error.error?error.error:myConstant.message.error["INT_SER_ERROR"]
        }
    }
}

//===============================>> To delete the order

const toDeleteOrder = async(id)=>{
    try {
        // first we get status from our db
        await toGetOrderStatus(id);
        // then we will make request to SENSIBULL MODIFY API
        const response = await axiosRequest("DELETE",{},headers,id);
        // console.log("this is delete function :",response);
        logger.info("this is delete function :",response);
        if(!response.payload){
            throw createErrorObject(myConstant.statusCode["HTTP_BAD-REQUEST"],null,myConstant.message.error["DELETE_ORDER"],null);
        }

        let updateDocs = await toUpdateAnOrder(id,response.payload.order);
        let {identifier,symbol,quantity,filled_quantity,order_status} = updateDocs;

        return createErrorObject(myConstant.statusCode["HTTP_SUCCESS"],myConstant.message.success["DELETE_ORDER"],null,{identifier,quantity,symbol,filled_quantity,order_status});
    } catch (error) {
        // console.log(error);
        logger.error(error);
        throw {
            statusCode:error.statusCode?error.statusCode:500,
            success:null,
            payload:null,
            error:error.error?error.error:myConstant.message.error["INT_SER_ERROR"]
        }
    }
}

//===============================>> To get status
const getStatusOfOrder = async(identifier)=>{
    try {
        let order =  await ordermodel.findOne({identifier});
        if(!order){
            throw {
                statusCode:myConstant.statusCode["HTTP_BAD-REQUEST"],
                error:myConstant.message.error["ID_ERROR"]
            };
        }
        return {
                statusCode:myConstant.statusCode["HTTP_SUCCESS"],
                success:true,
                payload:{
                    identifier:order.identifier,
                    symbol:order.symbol,
                    quantity:order.quantity,
                    filled_quantity:order.filled_quantity,
                    order_status:order.order_status
                },
                error:null
        } 
    } catch (err) {
        let statusCode = err.statusCode?err.statusCode:myConstant.statusCode["INT_SER_ERROR"];
        let error = err.error?err.error:myConstant.message.error["ERR_MODIFY_ORDER"];
        throw{
            statusCode,
            error,
            payload:null,
            success:null,
        }
    }
}

module.exports={
    placeOrder,
    modifyOrder,
    getStatusOfOrder,
    toDeleteOrder,
    callCronJob
}































// axiosRequest('POST',{symbol:"VEDANTA",
// quantity:300,order_tag:"yyyyyyy"},
// {'Content-Type': 'application/json',
// 'X-AUTH-TOKEN': '1234ABCD1234ABCD',},"place")
// .then(i=>{
//     console.log(i);
// }).catch(err=>{
//     console.log(err);
// })


// axiosRequest("POST",{
//     order_ids:["1685337198590-cde58ac8b6d5"]
// },
// {
//     'Content-Type': 'application/json',
//     'X-AUTH-TOKEN': '1234ABCD1234ABCD'
// },"status-for-ids").then(i=>{
//     console.log(i);
// }).catch(err=>{
//     console.log(err);
// })


// axiosRequest("DELETE"/"PUT",
// {
// },
// {
//     'Content-Type': 'application/json',
//     'X-AUTH-TOKEN': '1234ABCD1234ABCD'
// },
// "1685337198590-cde58ac8b6d5"
// ).
// then(i=>console.log(i)).
// catch(err=>console.log(err));