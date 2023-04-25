const express = require("express");
const app = express();
app.use(express.json())
require("dotenv").config();

const port = process.env.PORT || 5000

const connectToDatabase = require("./config/db")
connectToDatabase()
const userRoutes = require("./routes/userRoutes")
const adminRoutes = require("./routes/adminRoutes")
const doctorsRoutes = require("./routes/doctorsRoutes")
const path = require("path")
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/doctor", doctorsRoutes)

if (process.env.NODE_ENV === "production") {
    app.use("/", express.static("/client/build"));
  
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "/client/build/index.html"));
    });
  }

//middleware for handling errors
app.use((error, req,res, next)=>{
        res.status(500).json({
            message : error.message,
            stack : error.stack,
            success : false
        })
})
app.get("/", (req, res) => res.send("Hello World"))
app.listen(port, () => console.log(`Node Express Server Started at ${port}!`));