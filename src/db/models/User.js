const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }, 
  userInfo: {
    bio: String
  },
  userImage: {
    image: String,
    imageId: String,
    landscape: String,
    landscapeId: String
  },
  active: {
    type: Boolean,
    default: true
  },
  permission: {
    type: String,
    required: true,
    default: "user",
    enum: [
      "user",
      "admin"
    ]
  },
});
module.exports = User = mongoose.model("users", UserSchema);
