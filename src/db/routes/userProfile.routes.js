const express = require("express");
const router = express.Router();
const User = require("../models/User");
const imageUtils = require("../../utils/imageUtils");
const { isOwnUser } = require("../../utils/permissions");

router.get("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    const user = await User.findById(req.params.id).select(
      "email name date userImage userInfo _id"
    );
    res.json(user);
  }
});

router.get("/user/:username", async (req, res) => {
  const user = await User.find({
    name: req.params.username
  }).select("name userImage userInfo -_id");
  res.json(user);
});

router.put("/updateUser/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    const { name, email, userInfo } = req.body;
    const newUserInfo = { name, email, userInfo };
    Object.keys(newUserInfo).forEach(
      (key) => newUserInfo[key] === undefined && delete newUserInfo[key]
    );
    await User.find(
      {
        name: { $regex: new RegExp("^" + req.body.name.toLowerCase(), "i") }
      },
      async (err, response) => {
        if (err) console.error(err);
        if (response.length > 0 && response[0].id !== req.params.id) {
          return res.status(409).json({ status: "User already exists" });
        } else {
          await User.findByIdAndUpdate(req.params.id, newUserInfo);
          res.json({ status: "User updated" });
        }
      }
    );
  }
});

router.post("/uploadImage/", imageUtils.upload.single("image"), (req, res) => {
  if (isOwnUser(req, res))
    imageUtils.cloudinary.v2.uploader.upload(
      req.file.path,
      {
        folder: "user/avatar/",
        public_id: req.body.userId
      },
      async (err, result) => {
        if (err) {
          req.json(err.message);
        }
        await User.findByIdAndUpdate(
          req.body.userId,
          {
            $set: {
              "userImage.image": result.secure_url,
              "userImage.imageId": result.public_id
            }
          },
          (err) => {
            if (err) return next(err);
            return res.json({ status: "User image uploaded!" });
          }
        );
      }
    );
});

router.post(
  "/uploadLandscape/",
  imageUtils.upload.single("image"),
  (req, res) => {
    if (isOwnUser(req, res))
      imageUtils.cloudinary.v2.uploader.upload(
        req.file.path,
        {
          folder: "user/avatar/landscape/",
          public_id: req.body.userId
        },
        async (err, result) => {
          if (err) {
            req.json(err.message);
          }
          await User.findByIdAndUpdate(
            req.body.userId,
            {
              $set: {
                "userImage.landscape": result.secure_url,
                "userImage.landscapeId": result.public_id
              }
            },
            (err) => {
              if (err) return next(err);
              return res.json({ status: "User image uploaded!" });
            }
          );
        }
      );
  }
);

module.exports = router;
