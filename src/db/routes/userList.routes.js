const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.get("/", async (req, res) => {
  await User.find(
    {},
    "name userImage.image userImage.landscape userInfo _id",
    (err, users) => {
      if (err) return next(err);
      return res.json(users);
    }
  );
});

router.get("/:id", async (req, res) => {
  await User.find({}).select("email name _id", (err, users) => {
    if (err) return next(err);
    return res.json(users);
  });
});

module.exports = router;
