const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const RepostSchema = new Schema({
  reposter: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});
module.exports = Repost = mongoose.model("repost", RepostSchema);
