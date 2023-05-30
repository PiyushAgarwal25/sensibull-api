const axios = require('axios');
const myConstant = require("../constant");
const logger = require("../logs/devlogging");


const createErrorObject=(statusCode,success,error,payload)=>{
    return {statusCode,success,error,payload};
} 

const axiosRequest = async(method,body,headers,endpoint)=>{
    // console.log("running axios request");
    const url = `https://sensibull-uepa.onrender.com/api/v1/order/${endpoint}`;
    try {
        const response = await axios({
          url,
          method,
          data: (method === 'DELETE') ? undefined : body,
          headers
        });
        logger.info(response.data);
        return response.data;
    } catch (error) {
        logger.error("axios error request",error);
        throw createErrorObject(myConstant.statusCode["HTTP_ISE"],null,
        myConstant.message.error["INT_SER_ERROR"],null);
    }
}


module.exports = {
    createErrorObject,axiosRequest
}