const express = require("express");
const app = express();
const orders = require("./routes/orders");
const users = require("./routes/users");
const connectToMongo = require("./db/mongoose");

connectToMongo();

app.use("/",orders);
app.use("/api/users",users);

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`App started at Port:${PORT}`)
})



