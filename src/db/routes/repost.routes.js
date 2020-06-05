const express = require("express");
const router = express.Router();
const Repost = require("../models/Repost");
const { isAdmin } = require("../../utils/permissions");
const {
  uploadNotification,
  removeNotification
} = require("../../utils/notifications");

router.post("/:id", async (req, res) => {
    // Record stalk
    await Repost.find(
      {
        reposter: req.user.id,
        post: req.body.postId
      },
      (err, requests) => {
        if (err) console.error(err);
        if (requests.length === 0) {
          const repost = new Repost({
            reposter: req.user.id,
            post: req.body.postId
          });
          repost.save(async (err, result) => {
            if (err) console.error(err);
            const repostId = result.id;
            await Post.findOneAndUpdate(
              { _id: req.body.postId },
              // $addToSet to push value without repeating it
              { $addToSet: { reposts: req.user.id } },
              // new: true returns updated doc
              { new: true },
              (err, result) => {
                if (err) console.error(err);
                uploadNotification(
                  req.user.id,
                  result.creator._id.toString(),
                  repostId,
                  "Repost",
                  "USER_REPOSTED_POST",
                  "repost"
                );
                return res.json({ status: "Repost done" });
              }
            );
          });
        } else {
          return res.json({ status: "Repost already done" });
        }
      }
    );
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

router.delete("/", async (req, res) => {
  let query = { _id: req.body.postId };
  if (!isAdmin(req)) query.reposter = req.user.id;
    Repost.findOneAndDelete(query,
      async (err, response) => {
        if (err) console.log(err);
        const repostId = response.id;
        if (response) {
          await Post.findByIdAndUpdate(
            response.post._id.toString(),
            { $pull: { reposts: req.user.id } },
            { new: true },
            (err, result) => {
              if (err) console.error(err);
              removeNotification(
                req.user.id,
                result.creator._id.toString(),
                repostId,
                "USER_REPOSTED_POST"
              );
              return res.json({ status: "Repost deleted" });
            }
          );
        } else {
          return res.json({ status: "Repost not found" });
        }
      }
    );
});

module.exports = router;
