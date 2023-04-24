const mongoose = require('mongoose')

const Schema = mongoose

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique : true
      },
      password: {
        type: String,
        required: true,
      },
      isDoctor: {
        type: Boolean,
        default: false,
      },
      isAdmin: {
        type: Boolean,
        default: false,
      },
      seenNotifications: {
        type: Array,
        default: [],
      },
      unseenNotifications: {
        type: Array,
        default: [],
      },

}, {
    timestamps : true
})

const User = mongoose.model("User", userSchema)
module.exports = User