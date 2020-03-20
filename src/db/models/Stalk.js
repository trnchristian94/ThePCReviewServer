const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const StalkSchema = new Schema({
  requester: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model("stalks", StalkSchema);
