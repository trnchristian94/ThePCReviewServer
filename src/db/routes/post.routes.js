const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const Stalk = require("../models/Stalk");

const imageUtils = require("../../utils/imageUtils");
const {
  uploadNotification,
  removeNotification
} = require("../../utils/notifications");
const { isOwnUser } = require("../../utils/permissions");

const ACCEPTED = 2;

router.post(
  "/:id/answer/:postId",
  imageUtils.upload.single("image"),
  async (req, res) => {
    doPosting(req, res, true);
  }
);
router.post("/:id", imageUtils.upload.single("image"), async (req, res) => {
  doPosting(req, res, false);
});

const doPosting = async (req, res, isAnswer) => {
  if (isOwnUser(req, res)) {
    if (req.file && req.file.size > 3500000) {
      return res.json({
        error: "Image exceeds max size 3.5MB, please upload another image."
      });
    }
    req.body.creator = req.params.id;
    if (isAnswer) {
      req.body.answeredPost = req.params.postId;
    }
    Post.create(req.body, (err, post) => {
      if (err) return res.json(err.message);
      if (req.file) {
        imageUtils.cloudinary.v2.uploader.upload(
          req.file.path,
          {
            folder: "posts/",
            public_id: post.id
          },
          async (err, result) => {
            if (err) return res.json(err.message);
            Post.findByIdAndUpdate(
              post.id,
              {
                $set: {
                  "postImage.image": result.secure_url,
                  "postImage.imageId": post.id
                }
              },
              (err) => {
                if (err) return next(err);
                if (isAnswer) {
                  addAnswerToPost(req, res, req.params.postId, post.id);
                } else {
                  return res.json({ status: "Post with image uploaded!" });
                }
              }
            );
          }
        );
      } else {
        if (isAnswer) {
          addAnswerToPost(req, res, req.params.postId, post.id);
        } else {
          return res.json({ status: "Post uploaded" });
        }
      }
    });
  }
};

const addAnswerToPost = (req, res, answeredPost, postId) => {
  Post.findByIdAndUpdate(
    answeredPost,
    // $addToSet to push value without repeating it
    { $addToSet: { answers: postId } },
    // new: true returns updated doc
    { new: true },
    (err, result) => {
      if (err) console.error(err);
      uploadNotification(
        req.params.id,
        result.creator._id,
        postId,
        "Post",
        "USER_ANSWERED_POST",
        "answer"
      );
      return res.json({ status: "Post answer uploaded" });
    }
  );
};

router.delete("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    await Post.findByIdAndDelete(req.body.postId, (err, post) => {
      if (err) return res.json(err.message);
      if (!post) return res.json({ status: "Post not found" });
      if (post.answeredPost) {
        // Removes the answers from array of answers
        Post.findOneAndUpdate(
          { _id: post.answeredPost._id.toString() },
          { $pull: { answers: req.body.postId } },
          { new: true },
          (err, result) => {
            if (err) console.error(err);
            console.log(result);
          }
        );
      }
      if (post.postImage) {
        imageUtils.cloudinary.v2.uploader.destroy(
          `posts/${post.postImage.imageId}`,
          (err, result) => {
            if (err) console.log(err.message);
            return res.json({ status: "Post with image deleted" });
          }
        );
      } else {
        return res.json({ status: "Post deleted" });
      }
    });
  }
});

router.get("/", async (req, res) => {
  await Post.find()
    .populate("creator", "name")
    .populate({
      path: "answeredPost",
      model: "Post",
      populate: {
        path: "creator",
        model: "User",
        select: "name userImage.image"
      }
    })
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});

router.get("/from/:id/amount", async (req, res) => {
  await Post.countDocuments(
    {
      creator: req.params.id
    },
    (err, result) => {
      if (err) console.log(err);
      res.json(result);
    }
  );
});
router.get("/from/:id", async (req, res) => {
  await Post.find({
    creator: req.params.id
  })
    .sort("-date")
    .populate("creator", "name userImage.image")
    .populate({
      path: "answeredPost",
      model: "Post",
      populate: {
        path: "creator",
        model: "User",
        select: "name userImage.image"
      }
    })
    .exec((err, posts) => {
      if (err) console.log(err);
      Repost.find({
        reposter: req.params.id
      })
        .populate("reposter", "name userImage.image")
        .populate({
          path: "post",
          model: "Post",
          populate: {
            path: "creator",
            model: "User",
            select: "name userImage.image"
          }
        })
        .populate({
          path: "post",
          model: "Post",
          populate: {
            path: "answeredPost",
            model: "Post",
            populate: {
              path: "creator",
              model: "User",
              select: "name userImage.image"
            }
          }
        })
        .exec((err, reposts) => {
          if (err) console.log(err);
          res.json(sortAllPosts(posts, reposts));
        });
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
          .populate({
            path: "answeredPost",
            model: "Post",
            populate: {
              path: "creator",
              model: "User",
              select: "name userImage.image"
            }
          })
          .exec((err, posts) => {
            if (err) console.log(err);
            Repost.find({
              reposter: { $in: requesters }
            })
              .populate("reposter", "name userImage.image")
              .populate({
                path: "post",
                model: "Post",
                populate: {
                  path: "creator",
                  model: "User",
                  select: "name userImage.image"
                }
              })
              .populate({
                path: "post",
                model: "Post",
                populate: {
                  path: "answeredPost",
                  model: "Post",
                  populate: {
                    path: "creator",
                    model: "User",
                    select: "name userImage.image"
                  }
                }
              })
              .exec((err, reposts) => {
                if (err) console.log(err);
                res.json(sortAllPosts(posts, reposts));
              });
          });
      }
    ).select("recipient status -_id");
  }
});

// To add a like to a post
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
  )
    .populate("creator", "name userImage.image")
    .populate({
      path: "answeredPost",
      model: "Post",
      populate: {
        path: "creator",
        model: "User",
        select: "name userImage.image"
      }
    });
});

// To remove a like from a post
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
  )
    .populate("creator", "name userImage.image")
    .populate({
      path: "answeredPost",
      model: "Post",
      populate: {
        path: "creator",
        model: "User",
        select: "name userImage.image"
      }
    });
});

router.get("/likes/:id/amount", async (req, res) => {
  await Post.countDocuments({ likes: req.params.id }, (err, result) => {
    if (err) console.error(err);
    res.json(result);
  });
});

router.get("/likes/:id", async (req, res) => {
  await Post.find({ likes: req.params.id }, (err, result) => {
    if (err) console.error(err);
    res.json(result);
  })
    .populate("creator", "name userImage.image")
    .populate({
      path: "answeredPost",
      model: "Post",
      populate: {
        path: "creator",
        model: "User",
        select: "name userImage.image"
      }
    });
});

const sortAllPosts = (posts, reposts) => {
  let totalPosts = [];
  for (let i = 0; i < posts.length; i++) {
    totalPosts.push(posts[i]);
  }
  for (let i = 0; i < reposts.length; i++) {
    totalPosts.push(reposts[i]);
  }
  totalPosts.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  return totalPosts;
};

module.exports = router;
