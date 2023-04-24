require("dotenv").config();
const mongoose = require('mongoose')

const connectDB = async() =>{
    try {
        console.log(process.env.MONGO_URI+"eDocQuick_DB_")
        await mongoose.connect(process.env.MONGO_URI+"eDocQuick_DB_",{
            useNewUrlParser : true,
            useUnifiedTopology : true,  
        })
        console.log("Connected to MongoDB successfully")
    } catch (error) {
        console.error("MongoDB connection failed")
        process.exit(1)
    }
}

module.exports = connectDB


