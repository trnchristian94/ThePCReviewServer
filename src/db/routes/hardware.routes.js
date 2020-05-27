const express = require("express");
const router = express.Router();
const Hardware = require("../models/Hardware");

const imageUtils = require("../../utils/imageUtils");
const { isOwnUser } = require("../../utils/permissions");

router.post("/add/:id", imageUtils.upload.array("images"), async (req, res) => {
  if (isOwnUser(req, res)) {
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
    req.body.creator = req.params.id;
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
  }
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
  await Hardware.find(findParameters)
    .sort("-date")
    .populate("creator", "name userImage.image")
    .exec((err, response) => {
      if (err) console.log(err);
      res.json(response);
    });
});

router.delete("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    Hardware.findByIdAndDelete(req.body.hardwareId, (err, hardware) => {
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
  }
});

router.put("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    const { name, type, description, price } = req.body;
    const newPieceInfo = { name, type, description, price };
    await Hardware.findByIdAndUpdate(
      req.body.pieceId,
      newPieceInfo,
      (err, piece) => {
        if (err) return res.json(err.message);
        if (!piece)
          return res.status(404).json({ status: "Hardware not found" });
        return res.json({ status: "Hardware piece updated" });
      }
    );
  }
});
router.put("/setPrincipalImage/:id", async (req, res) => {
  let images = req.body.images;
  let temp = images[0];
  images[0] = images[req.body.index];
  images[req.body.index] = temp;
  if (isOwnUser(req, res)) {
    await Hardware.update(
      { _id: req.body.pieceId },
      { $set: { images: images } },
      (err, hardware) => {
        if (err) return res.json(err.message);
        if (!hardware)
          return res.status(404).json({ status: "Hardware not found" });
        return res.json({ status: "Image set as principal" });
      }
    );
  }
});

router.put("/removeImage/:id", async (req, res) => {
  const imgId = req.body.images[req.body.index].imageId;
  if (isOwnUser(req, res)) {
    Hardware.findOne({ _id: req.body.pieceId }, (err, hardware) => {
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
  }
});

module.exports = router;
