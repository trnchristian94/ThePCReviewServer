const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Create Schema
const UserSchema = new Schema({});

const PostSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  answeredPost: {
    type: Schema.Types.ObjectId,
    ref: "Post"
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  reposts: [
    {
      type: Schema.Types.ObjectId,
      ref: "Repost"
    }
  ],
  answers: [
    {
      type: Schema.Types.ObjectId,
      ref: "Post"
    }
  ],
  postImage: {
    image: String,
    imageId: String
  }
});
module.exports = Post = mongoose.model("posts", PostSchema);
mongoose.model("User", UserSchema);
