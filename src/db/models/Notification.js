const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.model("Post", new Schema({}));
mongoose.model("Stalk", new Schema({}));
// Create Schema
const NotificationSchema = new Schema({
  read: Boolean,
  date: {
    type: Date,
    default: Date.now
  },
  fromUser: { 
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  toUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: Schema.Types.ObjectId,
    required: true,
    // Instead of a hardcoded model name in `ref`, `refPath` means Mongoose
    // will look at the `onModel` property to find the right model.
    refPath: "typeModel"
  },
  typeModel: {
    type: String,
    required: true,
    enum: ["Post", "Stalk"]
  },
  message: {
    type: String
  },
  iconType: {
    type: String
  }
});
module.exports = Notification = mongoose.model(
  "notifications",
  NotificationSchema
);
