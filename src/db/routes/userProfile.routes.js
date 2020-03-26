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

router.put("/updateUser/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    const { name, email, userInfo } = req.body;
    const newUserInfo = { name, email, userInfo };
    Object.keys(newUserInfo).forEach(
      key => newUserInfo[key] === undefined && delete newUserInfo[key]
    );
    await User.findByIdAndUpdate(req.params.id, newUserInfo);
    res.json({ status: "User updated" });
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
      (err, result) => {
        if (err) {
          req.json(err.message);
        }
        const newImgInfo = {
          userImage: { image: result.secure_url, imageId: result.public_id }
        };
        User.findByIdAndUpdate(req.body.userId, newImgInfo, err => {
          if (err) return next(err);
          return res.json({ status: "User image uploaded!" });
        });
      }
    );
});

module.exports = router;
