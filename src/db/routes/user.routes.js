const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
// Load input validation
const validateRegisterInput = require("../../userLogic/validation/register");
const validateLoginInput = require("../../userLogic/validation/login");
// Load User model
const User = require("../models/User");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.find(
    { name: { $regex: new RegExp("^" + req.body.name.toLowerCase(), "i") } },
    (err, response) => {
      if (err) console.error(err);
      if (response.length > 0) {
        return res.status(409).json({ name: "Username already exists" });
      } else {
        User.findOne({
          email: { $regex: new RegExp("^" + req.body.email.toLowerCase(), "i") }
        }).then((user) => {
          if (user) {
            return res.status(409).json({ email: "Email already exists" });
          } else {
            const newUser = new User({
              name: req.body.name,
              email: req.body.email,
              password: req.body.password,
              userInfo: { bio: "Hi there! I'm using The PC Review" },
              userImage: {
                image:
                  "https://res.cloudinary.com/dz6ogknjd/image/upload/v1586040223/user/avatar/default.png",
                imageId: null
              }
            });
            // Hash password before saving in database
            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                  .save()
                  .then((user) => res.json(user))
                  .catch((err) => console.log(err));
              });
            });
          }
        });
      }
    }
  );
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  User.findOne({ email }).then((user) => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    // Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: "24h" // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

module.exports = router;
