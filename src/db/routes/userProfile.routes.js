const express = require("express");
const router = express.Router();
const User = require("../models/User.tsx");

router.get("/:id", async (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(400).send({
      message: "User not allowed"
    });
  }
  const user = await User.findById(req.params.id).select("email name date _id");
  res.json(user);
});

module.exports = router;
