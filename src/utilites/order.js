const ordermodel = require("../models/order");
const axios = require('axios');


// this is cron job function 
// first we will get all order with order_Status as "open"
// second we will fetch the latest status from sensibull db
// we will pass the ids and responses to the updateOrders function

const cronJob = async ()=>{
    // fetching all the orders with open status from db
    let orders = await ordermodel.find({order_status:"open"},"identifier");
    let fetchorders = orders.reduce((a,b)=>{
        a.push(b.identifier);
        return a;
    },[]);

    // now getting the status using the Sensibull's status API
    const url = `${process.env.URL}/api/v1/order/status-for-ids`;
    const headers = {
    'X-AUTH-TOKEN': process.env.TOKEN,
    'Content-Type': 'application/json',
    };
    const body = {
        order_ids:fetchorders
    };

    try {
        const response = await axios.post(url, body, { headers });
        // will update the order's statues and also change the amount of filled quantity
        toUpdateOrders(fetchorders,response.data.payload);
    } catch (error) {
        console.log(error);
        console.log("there was a error");
    }
}


// this function will recieve ids as well as response coming from status api
// then we will update the db with latest updates

const toUpdateOrders = async (orders,newResponse)=>{
    try {
        // will find the order with the order_id and then update the order
        orders.forEach(async (element,i) => {
            let updatedOrder = await ordermodel.findOneAndUpdate({identifier:element},
                {
                    order_status:newResponse[i].status,
                    filled_quantity:newResponse[i].filled_quantity,
                    quantity:newResponse[i].request_quantity // todo do we need to update quantity
                },
                {new:true}
                )
            // console.log(updatedOrder);
        });
    } catch (error) {
        console.log("there was error while changing the orderStatues.");
        throw "there was error while changing the orderStatues."
    }
}


// will take the id and latest response and update the db
const toUpdateAnOrder = async (id,newResponse)=>{
    // console.log("toupdateanorder");
    // console.log("this is the id:",id,newResponse);
    try {
        // will find the order with the order_id and then update the order
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
        console.log("there was error while changing the orderStatues.")
        throw "there was error while changing the orderStatues.";
    }
}

// this function return true if order is open
// this function returns false in any other case i.e complete ,error , cancel
const toGetOrderStatus = async(id)=>{
    // console.log(id);
    try {
        const order = await ordermodel.findOne({identifier:id});
        // console.log(order);
        // will check even order is present or not
        if(order.length ===0){
            throw undefined;
        }
        // if the order status is open we will give the true value
        if(order.order_status==="open"){
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

// this function will make modification request to the sensibull api
// if we can't do modification then we will pass 2
// if it is modified then we will update the status of our order

const toModifyAnOrder = async(id,quantity)=>{
    // console.log("toModifyAnOrder",id,typeof quantity);
    const url = `${process.env.URL}/api/v1/order/${id}`;
    const headers = {
    'X-AUTH-TOKEN': process.env.TOKEN,
    'Content-Type': 'application/json',
    };
    const body = {
        quantity
    };
    try {
        const response = await axios.put(url, body, { headers });
        // console.log(response.data);

        // modification can't be done because quantity is already filled
        if(!response.data.payload){
            return 2;
        }

        // now we will update the document with latest update in our db
        let updateDocs = await toUpdateAnOrder(id,response.data.payload.order);
        // console.log(updateDocs);

        // and then send the update docs as response to the person
        let {identifier,symbol,quantity,filled_quantity,order_status} = updateDocs;
        return {
            success:"success",
            payload:{
                identifier,symbol,quantity,filled_quantity,order_status
            }
        }
    } catch (error) {
        throw "there was error while modification process";
    }
}


const toDeleteOrder = async(id)=>{
    const url = `${process.env.URL}/api/v1/order/${id}`;
    const headers = {
    'X-AUTH-TOKEN': process.env.TOKEN,
    'Content-Type': 'application/json',
    };
    try {
        const response = await axios.delete(url,{ headers });
        // if order cannot be cancelled now or id is unavailable
        if(!response.data.payload.order){
            return 2;
        }

        // now we will update the document with latest update in our db
        let updateDocs = await toUpdateAnOrder(id,response.data.payload.order);
        // console.log(updateDocs);

        // and then send the update docs as response to the person
        let {identifier,symbol,quantity,filled_quantity,order_status} = updateDocs;
        return {
            success:"success",
            payload:{
                identifier,symbol,quantity,filled_quantity,order_status
            }
        }
        
    } catch (error) {
        // console.log(error);
        throw "error occured inside while deleting order";
    }
}



module.exports = {
    toUpdateOrders,
    toGetOrderStatus,
    toModifyAnOrder,
    cronJob,
    toDeleteOrder
}


// {
//     "statusCode": 200,
//     "mesage": "can't update requested quantity"
// }


// {
//     "success": true,
//     "payload": {
//         "order": {
//             "_id": "6471a4aa5ed6ebb9808cb63d",
//             "order_id": "1685169322361-acddc2d0ef52",
//             "order_tag": "yyyyyyy",
//             "symbol": "L&T",
//             "request_quantity": 197,
//             "filled_quantity": 63,
//             "status": "open"
//         },
//         "message": "order update success"
//     }
// }



//
// {
//     "success": true,
//     "payload": {
//         "order": null,
//         "message": "order cancel success"
//     }
// }

// {
//     "success": true,
//     "payload": {
//         "order": {
//             "_id": "6471b5c28915061124383bf0",
//             "order_id": "1685173698257-cd11327dcc2d",
//             "order_tag": "yyyyyyy",
//             "symbol": "L&T",
//             "request_quantity": 200,
//             "filled_quantity": 134,
//             "status": "cancel"
//         },
//         "message": "order cancel success"
//     }
// }