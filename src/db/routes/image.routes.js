const express = require("express");
const router = express.Router();
const Image = require("../models/Image");
const imageUtils = require("../../utils/imageUtils");

router.get("/", (req, res) => {
  Image.find((err, images) => {
    if (err) {
      res.json(err.message);
    } else {
      res.json(images);
    }
  });
});

router.post("/", imageUtils.upload.single("image"), (req, res) => {
  imageUtils.cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
    if (err) {
      req.json(err.message);
    }
    req.body.image = result.secure_url;
    // add image's public_id to image object
    req.body.imageId = result.public_id;

    Image.create(req.body, (err, image) => {
      if (err) {
        res.json(err.message);
        return res.redirect("/");
      } else {
        res.json({ status: "Image uploaded!" });
      }
    });
  });
});

router.delete("/:id", async (req, res) => {
  await Image.findByIdAndRemove(req.params.id);
  const { imageId } = req.body;
  imageUtils.cloudinary.v2.uploader.destroy(imageId, (err, result) => {
    if (err) {
      req.json(err.message);
    }
    res.json({ status: "Image deleted" });
  });
});

module.exports = router;
