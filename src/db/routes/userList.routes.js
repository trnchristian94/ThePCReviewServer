const express = require("express");
const router = express.Router();

const User = require("../models/User.tsx");

router.get("/", async (req, res) => {
  const users = await User.find({}).select("email name _id");
  console.log(users);
  res.json(users);
});

router.get("/:id", async (req, res) => {
  const users = await User.find({}).select("email name _id");
  res.json(users);
});

module.exports = router;
