const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Doctor = require("../models/Doctor")
const AuthMiddleware = require("../middlewares/AuthMiddleware")


router.get("/doctors-list", AuthMiddleware, async(req, res, next)=>{
    try {
        const doctors = await Doctor.find({})
        res.status(200).send({message : "Doctors fetched successfully",
    success : true, data : doctors})
    }
     catch (error) {
        console.log(error)
        res.status(500).send("Error while deleting")
        next(error)
    }    
})

router.get("/users-list", AuthMiddleware, async(req, res, next)=>{
    try {
        const users = await User.find({})
        res.status(200).send({message : "Users fetched successfully",
    success : true, data : users})
    }
     catch (error) {
        console.log(error)
        res.status(500).send("Error while deleting")
        next(error)
    }    
})

router.post("/change-doctor-account-status", AuthMiddleware, async(req, res, next)=>{
    try {
        const {doctorId, status} = req.body
        const doctor = await Doctor.findByIdAndUpdate(doctorId, {
            status
        })
    //     res.status(200).send({message : "Doctor status changed successfully",
    // })
        const user = await User.findOne({_id : doctor.userId})
        const unseenNotifications = user.unseenNotifications
        unseenNotifications.push(
            {
                message : `Your doctor account has been ${status}` ,
               type : "new-doctor-request-changed",
                onClickPath : "/notifications"
            }
        )
        user.isDoctor = status==="approved"? true : false
        await user.save()
        // await user.findByIdAndUpdate(user._id, {unseenNotifications})

        // const doctors = await Doctor.find({})

        return res.status(200).send({success : true, 
        message : "Doctor status changed successfully",
        data : doctor
    })
}
     catch (error) {
        console.log(error)
        res.status(500).send("Error while deleting")
        next(error)
    }    
})



module.exports = router



