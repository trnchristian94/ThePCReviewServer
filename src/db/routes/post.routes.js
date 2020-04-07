const express = require("express");
const router = express.Router();
const Post = require("../models/Post");

const { isOwnUser } = require("../../utils/permissions");

router.post("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    const post = new Post({
      creator: req.params.id,
      text: req.body.text
    });
    await post.save();
    res.json({ status: "Post saved" });
  }
});
router.get("/", async (req, res) => {
  await Post.find()
    .populate("creator", "name")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});
router.get("/from/:id", async (req, res) => {
  await Post.find({
    creator: req.params.id
  })
    .sort("-date")
    .populate("creator", "name")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});

module.exports = router;
