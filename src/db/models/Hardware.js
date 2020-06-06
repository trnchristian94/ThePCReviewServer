const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const HardwareSchema = new Schema({
  date: {
    type: Date,
    default: Date.now
  },
  creator: {
    type: String,
    ref: "User",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      "mobo",
      "cpu",
      "hdd",
      "ssd",
      "gpu",
      "ram",
      "optic",
      "soundcard",
      "case",
      "psu",
      "etc"
    ]
  },
  price: {
    type: Number,
    required: true
  },
  images: [
    {
      image: String,
      imageId: String
    }
  ],
  reviews: [
    {
      user: {
        type: String,
        ref: "User",
        required: true
      },
      review: {
        type: String,
        required: true
      },
      reviewRate: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  dislikes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ]
});
module.exports = Hardware = mongoose.model("hardware", HardwareSchema);
