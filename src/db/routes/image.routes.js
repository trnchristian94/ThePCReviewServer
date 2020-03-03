const express = require("express");
const router = express.Router();
const Image = require("../models/Image.tsx");
const keys = require("../config/keys");
const multer = require("multer");
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: "dz6ogknjd",
  api_key: process.env.CLOUDINARY_API_KEY || keys.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || keys.CLOUDINARY_API_SECRET
});
const imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are accepted!"), false);
  }
  cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter });
router.get("/", (req, res) => {
  Image.find((err, images) => {
    if (err) {
      res.json(err.message);
    } else {
      res.json(images);
    }
  });
});

router.post("/", upload.single("image"), (req, res) => {
  cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
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
  cloudinary.v2.uploader.destroy(imageId, (err, result) => {
    if (err) {
      req.json(err.message);
    }
    res.json({ status: "Image deleted" });
  });
});

module.exports = router;
