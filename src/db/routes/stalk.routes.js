const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Stalk = require("../models/Stalk");

// 1= requested, 2=accepted, 3=rejected
const REQUESTED = 1;
const ACCEPTED = 2;
const DENIED = 3;

// Get user stalk requests sent
router.get("/sent/:id", async (req, res) => {
  await Stalk.find(
    {
      requester: req.params.id
    },
    (err, requests) => {
      if (err) console.error(err);
      return res.json(requests);
    }
  ).select("recipient status -_id");
});

// Get list of user requests received
router.get("/received/:id/:amount?", async (req, res) => {
  await Stalk.find(
    {
      recipient: req.params.id,
      status: 1
    },
    (err, requests) => {
      if (err) console.error(err);
      if (req.params.amount) {
        return res.json({ stalkRequests: requests.length });
      }
      let requesters = [];
      for (let i = 0; i < requests.length; i++) {
        requesters.push(requests[i].requester);
      }
      User.find(
        {
          _id: { $in: requesters }
        },
        "name userImage.image userInfo _id",
        (err, users) => {
          if (err) console.error(err);
          return res.json(users);
        }
      );
    }
  ).select("requester status -_id");
});

// Get list of users who an user stalks
router.get("/stalking/:id/:amount?", async (req, res) => {
  await Stalk.find(
    {
      requester: req.params.id,
      status: 2
    },
    (err, requests) => {
      if (err) console.error(err);
      if (req.params.amount) {
        return res.json({ stalking: requests.length });
      }
      let requesters = [];
      for (let i = 0; i < requests.length; i++) {
        requesters.push(requests[i].recipient);
      }
      User.find(
        {
          _id: { $in: requesters }
        },
        "name userImage.image userInfo _id",
        (err, users) => {
          if (err) console.error(err);
          return res.json(users);
        }
      );
    }
  ).select("recipient status -_id");
});

// Get list of users who stalk an user
router.get("/stalkers/:id/:amount?", async (req, res) => {
  await Stalk.find(
    {
      recipient: req.params.id,
      status: 2
    },
    (err, requests) => {
      if (err) console.error(err);
      if (req.params.amount) {
        return res.json({ stalkers: requests.length });
      }
      let requesters = [];
      for (let i = 0; i < requests.length; i++) {
        requesters.push(requests[i].requester);
      }
      User.find(
        {
          _id: { $in: requesters }
        },
        "name userImage.image userInfo _id",
        (err, users) => {
          if (err) console.error(err);
          return res.json(users);
        }
      );
    }
  ).select("requester status -_id");
});

router.delete("/cancel/:id", async (req, res) => {
  await Stalk.findOneAndRemove(
    {
      requester: req.params.id,
      recipient: req.body.recipient
    },
    (err, response) => {
      if (err) console.error(err);
      if (response) {
        return res.json({ status: "Stalk canceled" });
      } else {
        return res.json({ status: "Stalk not found" });
      }
      return;
    }
  );
});

// Accept, deny, cancel actions for a stalk request
router.put("/:action/:id", async (req, res) => {
  let status = 0;
  let jsonStatus = "";
  if (req.params.action === "accept") {
    status = ACCEPTED;
    jsonStatus = "User added to stalks.";
  } else if (req.params.action === "deny") {
    status = DENIED;
    jsonStatus = "User request denied.";
  } else {
    return res.json({ status: "Undefined" });
  }
  Stalk.findOneAndUpdate(
    {
      requester: req.body.requester,
      recipient: req.params.id,
      status: 1
    },
    { status: status },
    (err, stalkReq) => {
      if (err) console.error(err);
      if (stalkReq) {
        return res.json({ status: jsonStatus });
      } else {
        return res.json({ status: "No user requests where found" });
      }
    }
  );
});

router.post("/:id", async (req, res) => {
  // Record stalk
  const stalk = new Stalk({
    requester: req.params.id,
    recipient: req.body.recipient,
    status: REQUESTED
  });
  await stalk.save(err => {
    if (err) console.error(err);
    // saved!
    return res.json({ status: "User request sent" });
  });
});

module.exports = router;