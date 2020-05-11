const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Stalk = require("../models/Stalk");

const {
  uploadNotification,
  removeNotification
} = require("../../utils/notifications");
const { isOwnUser } = require("../../utils/permissions");

const ACCEPTED = 2;

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

router.delete("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    await Post.findByIdAndRemove(req.body.postId);
    res.json({ status: "Post deleted" });
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
    .populate("creator", "name userImage.image")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});

router.get("/fromStalkings/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    await Stalk.find(
      {
        requester: req.params.id,
        status: ACCEPTED
      },
      (err, requests) => {
        if (err) console.error(err);
        if (req.params.amount) {
          return res.json({ stalking: requests.length });
        }
        let requesters = [];
        requesters.push(req.params.id);
        for (let i = 0; i < requests.length; i++) {
          requesters.push(requests[i].recipient);
        }
        Post.find({
          creator: { $in: requesters }
        })
          .sort("-date")
          .populate("creator", "name userImage.image")
          .exec((err, response) => {
            if (err) console.log(err);
            res.json(response);
          });
      }
    ).select("recipient status -_id");
  }
});

router.put("/like/:id", async (req, res) => {
  await Post.findOneAndUpdate(
    { _id: req.params.id },
    // $addToSet to push value without repeating it
    { $addToSet: { likes: req.user.id } },
    // new: true returns updated doc
    { new: true },
    (err, result) => {
      if (err) console.error(err);
      res.json(result);
      uploadNotification(
        req.user.id,
        result.creator.id,
        result.id,
        "Post",
        "USER_LIKED_POST",
        "like"
      );
    }
  ).populate("creator", "name userImage.image");
});

router.put("/removeLike/:id", async (req, res) => {
  await Post.findOneAndUpdate(
    { _id: req.params.id },
    // $pull to remove value
    { $pull: { likes: req.user.id } },
    { new: true },
    (err, result) => {
      if (err) console.error(err);
      res.json(result);
      removeNotification(
        req.user.id,
        result.creator.id,
        result.id,
        "USER_LIKED_POST"
      );
    }
  ).populate("creator", "name userImage.image");
});

module.exports = router;
