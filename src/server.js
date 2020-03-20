const express = require("express");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");

const users = require("./db/routes/user.routes");
const userList = require("./db/routes/userList.routes");
const userProfile = require("./db/routes/userProfile.routes");
const tasks = require("./db/routes/task.routes");
const images = require("./db/routes/image.routes");
const stalks = require("./db/routes/stalk.routes");
const keys = require("./db/config/keys");

const app = express();

//const { mongoose } = require('./database');

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
app.use("/api/tasks", tasks);
app.use("/api/users", users);
app.use("/api/images", images);
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
app.use("/api/stalks", stalks);

// Static files
app.use(express.static(path.join(__dirname, "public/")));

// Connect to MongoDB
mongoose
  .connect(process.env.mongoURI || keys.mongoURI, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));
// Settings
app.set("port", process.env.PORT || 8000);
app.listen(app.get("port"), () =>
  console.log(`Server up and running on port ${app.get("port")} !`)
);
