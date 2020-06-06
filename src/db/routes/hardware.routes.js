const express = require("express");
const router = express.Router();
const Hardware = require("../models/Hardware");

const imageUtils = require("../../utils/imageUtils");
const { isAdmin } = require("../../utils/permissions");

router.post("/add", imageUtils.upload.array("images"), async (req, res) => {
  if (req.files.length > 0) {
    if (req.files.length > 6) {
      return res.status(400).json({
        status: "Max image files exceeded, upload max 6."
      });
    }
    for (var i = 0; i < req.files.length; i++) {
      if (req.files[i] && req.files[i].size > 3500000) {
        return res.status(400).json({
          status: "Image exceeds max size 3.5MB, please upload another image."
        });
      }
    }
  }
  req.body.creator = req.user.id;
  Hardware.create(req.body, (err, hw) => {
    if (err) return res.json(err.message);

    if (req.files.length > 0) {
      for (var i = 0; i < req.files.length; i++) {
        imageUtils.cloudinary.v2.uploader.upload(
          req.files[i].path,
          {
            folder: `hardware/`,
            public_id: `${hw.id}__${i}`
          },
          async (err, result) => {
            if (err) return res.json(err.message);
            Hardware.findByIdAndUpdate(
              hw.id,
              // $addToSet to push value without repeating it
              {
                $addToSet: {
                  images: {
                    image: result.secure_url,
                    imageId: result.public_id
                  }
                }
              },
              // new: true returns updated doc
              { new: true },
              (err, hwRes) => {
                if (err) return next(err);
                if (hwRes.images.length === req.files.length) {
                  return res.json({
                    status: "Hardware piece and images uploaded!"
                  });
                }
              }
            );
          }
        );
      }
    } else {
      return res.json({ status: "Hardware piece uploaded" });
    }
  });
});

router.get("/", async (req, res) => {
  let findParameters = {};
  if (req.query.name)
    findParameters.name = { $regex: req.query.name, $options: "i" };
  if (req.query.type) findParameters.type = req.query.type;
  findParameters.price = {
    $gte: req.query.minVal ? req.query.minVal : 0,
    $lte: req.query.maxVal ? req.query.maxVal : 10000
  };
  if (req.query.ownSetup) findParameters.users = req.user.id;
  await Hardware.find(findParameters)
    .sort("-date")
    .populate("creator", "name userImage.image")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});

router.get("/:id", async (req, res) => {
  await Hardware.findById(req.params.id)
    .populate("creator", "name userImage.image")
    .populate("reviews.user", "name userImage.image")
    .exec((err, response) => {
      if (err) console.log(err);
      console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
      res.json(response);
    });
});

router.get("/:id/users", async (req, res) => {
  await Hardware.findById(req.params.id)
    .sort("-date")
    .populate("users", "name description userInfo.bio userImage.image")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response.users);
    });
});
router.delete("/", async (req, res) => {
  let query = { _id: req.body.hardwareId };
  if (!isAdmin(req, res)) query.creator = req.user.id;
  Hardware.findOneAndDelete(query, (err, hardware) => {
    if (err) return res.json(err.message);
    if (!hardware) return res.status(404).json({ status: "Post not found" });
    if (hardware.images.length > 0) {
      imageUtils.cloudinary.v2.api.delete_resources_by_prefix(
        `hardware/${hardware.id}`,
        (err, result) => {
          if (err) console.log(err.message);
          return res.json({ status: "Hardware and images deleted" });
        }
      );
    } else {
      return res.json({ status: "Hardware deleted" });
    }
  });
});

router.put("/", async (req, res) => {
  let query = { _id: req.body.pieceId };
  if (!isAdmin(req, res)) query.creator = req.user.id;
  await Hardware.findOne(query, (err, piece) => {
    if (err) return res.json(err.message);
    if (!piece) return res.status(404).json({ status: "Hardware not found" });
    piece.name = req.body.name;
    piece.description = req.body.description;
    piece.price = req.body.price;
    if (piece.users.length === 0 || !piece.users) {
      piece.type = req.body.type;
    }
    piece.save((err, result) => {
      if (err) return res.json(err.message);
      if (!result)
        return res.status(404).json({ status: "Hardware not found" });
      return res.json({ status: "Hardware piece updated" });
    });
  });
});

router.put("/setPrincipalImage", async (req, res) => {
  let query = { _id: req.body.pieceId };
  if (!isAdmin(req, res)) query.creator = req.user.id;
  let images = req.body.images;
  let temp = images[0];
  images[0] = images[req.body.index];
  images[req.body.index] = temp;
  await Hardware.updateOne(
    query,
    { $set: { images: images } },
    (err, hardware) => {
      if (err) return res.json(err.message);
      if (!hardware)
        return res.status(404).json({ status: "Hardware not found" });
      return res.json({ status: "Image set as principal" });
    }
  );
});

router.put("/removeImage", async (req, res) => {
  let query = { _id: req.body.pieceId };
  if (!isAdmin(req, res)) query.creator = req.user.id;
  const imgId = req.body.images[req.body.index].imageId;
  Hardware.findOne(query, (err, hardware) => {
    if (err) return console.log(err.message);
    if (!hardware)
      return res.status(404).json({ status: "Hardware not found" });
    imageUtils.cloudinary.v2.uploader.destroy(`${imgId}`, (err, result) => {
      if (err) return res.json(err.message);
      hardware.update(
        { $pull: { images: { imageId: imgId } } },
        { safe: true, multi: true },
        (err) => {
          if (err) return console.log(err);
          return res.json({ status: "Hardware image deleted" });
        }
      );
    });
  });
});

// Setup routes

router.put("/addToSetup", async (req, res) => {
  let query = { _id: req.body.hardwareId };
  if (!isAdmin(req, res)) query.creator = req.user.id;
  Hardware.findOne(query, (err, hardware) => {
    if (err) return console.log(err.message);
    if (!hardware)
      return res.status(404).json({ status: "Hardware not found" });
    Hardware.findOne(
      { users: req.user.id, type: hardware.type },
      (err, hardwareFromUser) => {
        if (err) return console.log(err.message);
        if (hardwareFromUser)
          return res.status(400).json({
            status: `You can't add this hardware because you already added ${hardwareFromUser.name} to your setup as ${hardwareFromUser.type}, please remove it and try again.`
          });
        hardware.update(
          { $addToSet: { users: req.user.id } },
          { new: true },
          (err, result) => {
            if (err) return console.log(err.message);
            if (!result)
              return res.status(404).json({ status: "Hardware not found" });
            return res.json({ status: "Hardware added to your setup" });
          }
        );
      }
    );
  });
});

router.get("/lookForSetup/:id", async (req, res) => {
  Hardware.find({ users: req.query.user }, (err, hardware) => {
    return res.json(hardware);
  });
});

router.put("/removeFromSetup", async (req, res) => {
  Hardware.findOne(
    { _id: req.body.hardwareId, users: req.user.id },
    (err, hardware) => {
      if (err) return console.log(err.message);
      if (!hardware)
        return res.status(404).json({ status: "Hardware not found" });
      hardware.update(
        { $pull: { users: req.user.id } },
        { new: true },
        (err, result) => {
          if (err) return console.log(err.message);
          if (!result)
            return res.status(404).json({ status: "Hardware not removed" });
          return res.json({ status: "Hardware removed from your setup" });
        }
      );
    }
  );
});

router.put("/like", async (req, res) => {
  Hardware.findOne({ _id: req.body.hardwareId }, (err, hardware) => {
    if (err) return console.log(err.message);
    if (!hardware)
      return res.status(404).json({ status: "Hardware not found" });
    if (hardware.likes.includes(req.user.id)) {
      hardware.update(
        {
          $pull: { dislikes: req.user.id, likes: req.user.id }
        },
        { new: true },
        (err, result) => {
          if (err) return console.log(err.message);
          if (!result)
            return res
              .status(404)
              .json({ status: "Like hardware not removed" });
          return res.json({ status: "Like removed" });
        }
      );
    } else {
      hardware.update(
        {
          $pull: { dislikes: req.user.id },
          $addToSet: { likes: req.user.id }
        },
        { new: true },
        (err, result) => {
          if (err) return console.log(err.message);
          if (!result)
            return res.status(404).json({ status: "Hardware not liked" });
          return res.json({ status: "Hardware liked" });
        }
      );
    }
  });
});

router.put("/dislike", async (req, res) => {
  Hardware.findOne({ _id: req.body.hardwareId }, (err, hardware) => {
    if (err) return console.log(err.message);
    if (!hardware)
      return res.status(404).json({ status: "Hardware not found" });
    if (hardware.dislikes.includes(req.user.id)) {
      hardware.update(
        {
          $pull: { likes: req.user.id, dislikes: req.user.id }
        },
        { new: true },
        (err, result) => {
          if (err) return console.log(err.message);
          if (!result)
            return res
              .status(404)
              .json({ status: "Dislike hardware not removed" });
          return res.json({ status: "Dislike removed" });
        }
      );
    } else {
      hardware.update(
        {
          $pull: { likes: req.user.id },
          $addToSet: { dislikes: req.user.id }
        },
        { new: true },
        (err, result) => {
          if (err) return console.log(err.message);
          if (!result)
            return res.status(404).json({ status: "Hardware not disliked" });
          return res.json({ status: "Hardware disliked" });
        }
      );
    }
  });
});

// Reviews
router.post("/review/:id", async (req, res) => {
  if (req.body.reviewRate < 0 || req.body.reviewRate > 10)
    return res.status(400).json({
      status: "Max review rate is 10, and minimum is 0"
    });
  if (req.body.review.length < 20)
    return res.status(400).json({
      status: "Minimum review length is 20 characters"
    });
  Hardware.findOne({ _id: req.params.id }, async (err, hardware) => {
    if (err) return console.log(err.message);
    if (!hardware)
      return res.status(404).json({ status: "Hardware not found" });
    if (
      hardware.reviews.length > 0 &&
      hardware.reviews.find((h) => h.user === req.user.id) !== undefined
    ) {
      return res
        .status(400)
        .json({ status: "Only one review per user is allowed" });
    } else {
      Hardware.findOneAndUpdate(
        { _id: req.params.id },
        {
          $addToSet: {
            reviews: {
              user: req.user.id,
              review: req.body.review,
              reviewRate: req.body.reviewRate
            }
          }
        },
        { new: true },
        (err, result) => {
          if (err) return console.log(err.message);
          if (!result)
            return res.status(404).json({ status: "Hardware not reviewed" });
          return res.json({ result, status: "Review submitted" });
        }
      );
    }
  });
});

router.delete("/review/:hardwareId", async (req, res) => {
  const userId = req.body.userId;
  if (userId !== req.user.id && !isAdmin(req, res))
    return res
      .status(400)
      .json({ status: "User must be the owner of the review." });
  Hardware.findOne({ _id: req.params.hardwareId }, (err, hardware) => {
    if (err) return res.json(err.message);
    if (!hardware) return res.status(404).json({ status: "Review not found" });
    hardware.update(
      { $pull: { reviews: { user: userId } } },
      { safe: true, multi: true },
      (err) => {
        if (err) return console.log(err);
        return res.json({ status: "Review deleted" });
      }
    );
  });
});

module.exports = router;
