const express = require("express");
const router = express.Router();
const orderHelper = require("../Helpers/order");
const auth = require('../middleware/auth');
const { placeMyOrder, modifyMyOrder, deleteMyOrder, fetchMyOrder, getMyAllOrder } = require("../Helpers/mainroutes");

router.use(express.json());

orderHelper.callCronJob();

// to place order
router.post("/order-service",auth,placeMyOrder);

// to modify order
router.patch("/order-service",auth,modifyMyOrder);

//========================================>> cancel order
router.delete("/order-service",auth,deleteMyOrder);

//===================================>> fetch order status
router.post("/order-service/status",auth,fetchMyOrder);

//=====================================>> fetching all the orders of a particular USER
router.get("/getOrders",auth,getMyAllOrder)



module.exports = router;