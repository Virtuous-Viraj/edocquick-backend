const express = require('express')
const User = require('../models/User')
const Doctor = require("../models/Doctor")
const {hashPasswords} = require('./utils/hashPasswords')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const AuthMiddleware = require("../middlewares/AuthMiddleware")
const Appointment = require("../models/Appointment")
const moment = require("moment")
router.post("/register", async(req, res,next)=>{
    try {
        // console.log(req.body)
        const checkUserExists = await User.findOne({email : req.body.email})
        if(checkUserExists)
        {
            return res.status(400).send({error : "User already exists", success : false})
        }
            // console.log("hello")
            const hash = hashPasswords(req.body.password)
            req.body.password = hash
            const newUser = new User(req.body)
            await newUser.save()
            return res.status(200).send({message : "User Created Successfully", success : true})
        
    } catch (error) {
        next(error)
    }
})

router.post("/login", async(req, res, next)=>{
    try {
        const user = await User.findOne({email : req.body.email})
        if(!user)
        {
            return res.status(400).send({error : "User not found", success : false})
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password)
        if(!isMatch)
        {
            return res.status(400).send({error : "Invalid Credentials", success : false})
        }
        else{
            const token = jwt.sign({id : user._id}, process.env.JWT_SECRET, {expiresIn : "1d"})
            return res.status(200).send({message :"Login Successful" ,data : token, success : true})
        }
    } catch (error) {
        next(error)
    }
})


router.post("/get-user-info-by-id",AuthMiddleware ,async(req, res, next)=>{
    try {
        // console.log(req.body);
        const user =  await User.findOne({_id : req.body.userId})
        user.password = undefined
        if(!user)
        {
            return res.status(400).send({error : "User Does Not Exists", success : false})
        }
        else{
            return res.status(200).send({ data : user
            , success : true}) 
        }   
    } catch (error) {
        next(error)
    }
})

router.post("/apply-as-doctor", AuthMiddleware ,async(req, res,next)=>{
    try {
        const newDoctor = new Doctor({...req.body, status : "pending"})
        await newDoctor.save()
        const adminUser = await User.findOne({isAdmin : true})

        const unseenNotifications = adminUser.unseenNotifications
        unseenNotifications.push(
            {
                message : `${newDoctor.firstName} ${newDoctor.lastName} has applied for a Doctor's account` ,
               type : "new-doctor-request",
                data : {
                    doctorId : newDoctor._id,
                    name :  newDoctor.firstname + " " + newDoctor.lastname
                },
                onClickPath : "/admin/doctors-list"
            }
        )
        console.log(unseenNotifications)
        // update admin by pushing a new notification in the database
        await User.findByIdAndUpdate(adminUser._id, {unseenNotifications})
        return res.status(200).send({success : true, 
        message : "Applied for Doctor successfully"
    })
    } catch (error) {
        console.log(error)
        res.status(500).send("Error while applying")
        next(error)
    }
})

router.post("/mark-as-seen", AuthMiddleware ,async(req, res,next)=>{
    try {
        const user = await User.findOne({_id : req.body.userId})
        const unseenNotifications = user.unseenNotifications
        const seenNotifications = user.seenNotifications
        seenNotifications.push(...unseenNotifications)
        user.seenNotifications = unseenNotifications
        user.unseenNotifications = [] 
        user.seenNotifications = seenNotifications;
        const updatedUser = await user.save()
        updatedUser.password = undefined
        return res.status(200).send({success : true,
        message : "Marked as seen successfully",
        data : updatedUser
    })  
    }
     catch (error) {
        console.log(error)
        res.status(500).send("Error while applying")
        next(error)
    }
})

router.post("/delete-all", AuthMiddleware, async(req, res, next)=>{
    try {
        const user = await User.findOne({_id : req.body.userId})
        user.seenNotifications = []
        const updatedUser = await user.save()
        updatedUser.password = undefined
        return res.status(200).send({success : true,
        message : "Deleted successfully",
        data : updatedUser
    })  
    }
     catch (error) {
        console.log(error)
        res.status(500).send("Error while deleting")
        next(error)
    }    
})

router.get("/get-all-approved-doctors", AuthMiddleware, async (req, res) => {
    try {
      const doctors = await Doctor.find({ status: "approved" });
      res.status(200).send({
        message: "Doctors fetched successfully",
        success: true,
        data: doctors,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error applying doctor account",
        success: false,
        error,
      });
    }
  });

  router.post("/book-appointment", AuthMiddleware, async (req, res) => {
    try {
      req.body.status = "pending";
      req.body.date = moment(req.body.date, "DD-MM-YYYY").toISOString();
      req.body.time = moment(req.body.time, "HH:mm").toISOString();
      const newAppointment = new Appointment(req.body);
      await newAppointment.save();
      //pushing notification to doctor based on his userid
      const user = await User.findOne({ _id: req.body.doctorInfo.userId });
      user.unseenNotifications.push({
        type: "new-appointment-request",
        message: `A new appointment request has been made by ${req.body.userInfo.name}`,
        onClickPath: "/doctor/appointments",
      });
      await user.save();
      res.status(200).send({
        message: "Appointment booked successfully",
        success: true,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error booking appointment",
        success: false,
        error,
      });
    }
  });
  
  router.post("/check-booking-availability", AuthMiddleware, async (req, res) => {
    try {
      const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
      const test = moment(req.time)
      const formattedTime = test.format("HH:mm")
      const boundaries = await Doctor.find({_id : req.body.doctorId}).catch((e)=> console.log(e))
      const timings = boundaries[0].timings
      if(formattedTime <= timings[0] || formattedTime >= timings[1])
      {
        return res.status(200).send({
          message: "Appointments not available",
          success: false,
        });
      }
      const fromTime = moment(req.body.time, "HH:mm")
        .subtract(1, "hours")
        .toISOString();
      const toTime = moment(req.body.time, "HH:mm").add(1, "hours").toISOString();
      const doctorId = req.body.doctorId;
      const appointments = await Appointment.find({
        doctorId,
        date,
        time: { $gte: fromTime, $lte: toTime },
      });
      if (appointments.length > 0) {
        return res.status(200).send({
          message: "Appointments not available",
          success: false,
        });
      } else {
        return res.status(200).send({
          message: "Appointments available",
          success: true,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error booking appointment",
        success: false,
        error,
      });
    }
  });
  
  router.get("/get-appointments-by-user-id", AuthMiddleware, async (req, res) => {
    try {
      const appointments = await Appointment.find({ userId: req.body.userId });
      res.status(200).send({
        message: "Appointments fetched successfully",
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        message: "Error fetching appointments",
        success: false,
        error,
      });
    }
  });

module.exports = router