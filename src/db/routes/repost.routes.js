const express = require("express");
const router = express.Router();
const Repost = require("../models/Repost");
const { isOwnUser } = require("../../utils/permissions");
const {
  uploadNotification,
  removeNotification
} = require("../../utils/notifications");

router.post("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    // Record stalk
    await Repost.find(
      {
        reposter: req.params.id,
        post: req.body.postId
      },
      (err, requests) => {
        if (err) console.error(err);
        if (requests.length === 0) {
          const repost = new Repost({
            reposter: req.params.id,
            post: req.body.postId
          });
          repost
            .save(async(err, result) => {
              if (err) console.error(err);
              const repostId = result.id;
              await Post.findOneAndUpdate(
                { _id: req.body.postId },
                // $addToSet to push value without repeating it
                { $addToSet: { reposts: repostId } },
                // new: true returns updated doc
                { new: true },
                (err, result) => {
                  if (err) console.error(err);
                  uploadNotification(
                    req.params.id,
                    result.creator._id.toString(),
                    repostId,
                    "Repost",
                    "USER_REPOSTED_POST",
                    "repost"
                  );
                  return res.json({ status: "Repost done" });
                }
              )
            });
        } else {
          return res.json({ status: "Repost already done" });
        }
      }
    );
  }
});

router.get("/", async (req, res) => {
  await Repost.find()
    .populate("reposter")
    .populate("post")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});

router.delete("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    await Repost.findOneAndDelete({
      reposter: req.params.id,
      _id: req.body.postId
    }).exec((err, response) => {
      if (err) console.log(err);
      return res.json({ status: "Repost deleted" });
    });
  }
});

module.exports = router;