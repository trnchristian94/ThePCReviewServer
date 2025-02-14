const express = require("express");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const users = require("./db/routes/user.routes");
const userList = require("./db/routes/userList.routes");
const userProfile = require("./db/routes/userProfile.routes");
const stalks = require("./db/routes/stalk.routes");
const posts = require("./db/routes/post.routes");
const notifications = require("./db/routes/notification.routes");
const repost = require("./db/routes/repost.routes");
const hardware = require("./db/routes/hardware.routes");

const app = express();

// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

// Middlewares
app.use(morgan("dev"));
app.use(express.json()); // Permite al servidor entender json.

// Passport middleware
app.use(passport.initialize());

// Passport config
require("./db/config/passport")(passport);

// Routes
app.use("/api/users", users);
app.use(
  "/api/userList",
  passport.authenticate("jwt", { session: false }),
  userList
);
app.use(
  "/api/userProfile",
  passport.authenticate("jwt", { session: false }),
  userProfile
);
app.use(
  "/api/stalks",
  passport.authenticate("jwt", { session: false }),
  stalks
);
app.use("/api/posts", passport.authenticate("jwt", { session: false }), posts);
app.use(
  "/api/notifications",
  passport.authenticate("jwt", { session: false }),
  notifications
);
app.use(
  "/api/repost",
  passport.authenticate("jwt", { session: false }),
  repost
);
app.use(
  "/api/hardware",
  passport.authenticate("jwt", { session: false }),
  hardware
);
// Static files
app.use(express.static(path.join(__dirname, "public/")));

// Connect to MongoDB
mongoose
  .connect(process.env.mongoURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => console.log("MongoDB successfully connected"))
  .catch((err) => console.log(err));
// Settings
app.set("port", process.env.PORT || 8000);
app.listen(app.get("port"), () =>
  console.log(`Server up and running on port ${app.get("port")} !`)
);
