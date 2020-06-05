const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Stalk = require("../models/Stalk");
const {
  uploadNotification,
  removeNotification
} = require("../../utils/notifications");

const { getActiveUsers } = require("../../utils/permissions");

// 1= requested, 2=accepted, 3=rejected
const REQUESTED = 1;
const ACCEPTED = 2;
const DENIED = 3;

// Get user stalk requests sent and their status
router.get("/sent", async (req, res) => {
  await Stalk.find({ requester: req.user.id }, (err, requests) => {
    if (err) console.error(err);
    return res.json(requests);
  }).select("recipient status -_id");
});

// Get user stalk requests sent and their status
router.get("/sent/:toUser", (req, res) => {
  Stalk.findOne(
    { requester: req.user.id, recipient: req.params.toUser },
    (err, request) => {
      if (err) console.error(err);
      if (!request) return res.status(404).json(0);
      return res.json(request.status);
    }
  ).select("recipient status -_id");
});

// Get list of stalk requests received
router.get("/received/:id/amount", async (req, res) => {
  const idActives = await getActiveUsers();
  await Stalk.countDocuments(
    {
      recipient: req.params.id,
      status: REQUESTED,
      requester: { $in: idActives }
    },
    (err, result) => {
      if (err) console.error(err);
      return res.json(result);
    }
  );
});

// Get list of stalk requests received
router.get("/received/:id", async (req, res) => {
  const idActives = await getActiveUsers();
  await Stalk.find(
    {
      recipient: req.params.id,
      requester: { $in: idActives },
      status: REQUESTED
    },
    (err, requests) => {
      if (err) console.error(err);
      let requesters = [];
      for (let i = 0; i < requests.length; i++) {
        requesters.push(requests[i].requester);
      }
      User.find(
        {
          _id: { $in: requesters },
          active: { $ne: false }
        },
        "name userImage.image userImage.landscape userInfo _id",
        (err, users) => {
          if (err) console.error(err);
          return res.json(users);
        }
      );
    }
  ).select("requester status -_id");
});

// Get amount of users who an user stalks
router.get("/stalking/:id/amount", async (req, res) => {
  const idActives = await getActiveUsers();
  await Stalk.countDocuments(
    {
      requester: req.params.id,
      recipient: { $in: idActives },
      status: ACCEPTED
    },
    (err, result) => {
      if (err) console.error(err);
      return res.json(result);
    }
  );
});

// Get list of users who an user stalks
router.get("/stalking/:id", async (req, res) => {
  const idActives = await getActiveUsers();
  await Stalk.find(
    {
      requester: req.params.id,
      recipient: { $in: idActives },
      status: ACCEPTED
    },
    (err, requests) => {
      if (err) console.error(err);
      let requesters = [];
      for (let i = 0; i < requests.length; i++) {
        requesters.push(requests[i].recipient);
      }
      User.find(
        {
          _id: { $in: requesters },
          active: { $ne: false }
        },
        "name userImage.image userImage.landscape userInfo _id",
        (err, users) => {
          if (err) console.error(err);
          return res.json(users);
        }
      );
    }
  ).select("recipient status -_id");
});

// Get amount of users who stalk an user
router.get("/stalkers/:id/amount", async (req, res) => {
  const idActives = await getActiveUsers();
  await Stalk.countDocuments(
    {
      requester: { $in: idActives },
      recipient: req.params.id,
      status: ACCEPTED
    },
    (err, result) => {
      if (err) console.error(err);
      return res.json(result);
    }
  );
});

// Get list of users who stalk an user
router.get("/stalkers/:id", async (req, res) => {
  const idActives = await getActiveUsers();
  await Stalk.find(
    {
      requester: { $in: idActives },
      recipient: req.params.id,
      status: ACCEPTED
    },
    (err, requests) => {
      if (err) console.error(err);
      let requesters = [];
      for (let i = 0; i < requests.length; i++) {
        requesters.push(requests[i].requester);
      }
      User.find(
        {
          _id: { $in: requesters },
          active: { $ne: false }
        },
        "name userImage.image userImage.landscape userInfo _id",
        (err, users) => {
          if (err) console.error(err);
          return res.json(users);
        }
      );
    }
  ).select("requester status -_id");
});

router.delete("/cancel", async (req, res) => {
  await Stalk.findOneAndRemove(
    {
      requester: req.user.id,
      recipient: req.body.recipient
    },
    (err, response) => {
      if (err) console.error(err);
      if (response) {
        removeNotification(
          req.body.recipient,
          req.user.id,
          response.id,
          "STALK_ACCEPTED"
        );
        removeNotification(
          req.user.id,
          req.body.recipient,
          response.id,
          "STALKING"
        );
        return res.json({ status: "Stalk canceled" });
      } else {
        return res.json({ status: "Stalk not found" });
      }
    }
  );
});

// Accept, deny, cancel actions for a stalk request
router.put("/:action", async (req, res) => {
  let status = 0;
  let jsonStatus = "";
  if (req.params.action === "accept") {
    status = ACCEPTED;
    jsonStatus = "User added to stalks.";
  } else if (req.params.action === "deny") {
    status = DENIED;
    jsonStatus = "Stalk request denied.";
  } else {
    return res.json({ status: "Undefined" });
  }
  Stalk.findOneAndUpdate(
    {
      requester: req.body.requester,
      recipient: req.user.id,
      status: REQUESTED
    },
    { status: status },
    (err, stalkReq) => {
      if (err) console.error(err);
      if (stalkReq) {
        if (status === ACCEPTED) {
          uploadNotification(
            req.user.id,
            req.body.requester,
            stalkReq.id,
            "Stalk",
            "STALK_ACCEPTED",
            "stalk"
          );
          uploadNotification(
            req.body.requester,
            req.user.id,
            stalkReq.id,
            "Stalk",
            "STALKING",
            "stalk"
          );
        }
        return res.json({ status: jsonStatus });
      } else {
        return res.json({ status: "No stalk requests where found" });
      }
    }
  );
});

router.post("/", async (req, res) => {
  // Record stalk
  await Stalk.find(
    {
      requester: req.user.id,
      recipient: req.body.recipient,
      status: REQUESTED
    },
    (err, requests) => {
      if (err) console.error(err);
      if (requests.length === 0) {
        const stalk = new Stalk({
          requester: req.user.id,
          recipient: req.body.recipient,
          status: REQUESTED
        });
        stalk.save((err) => {
          if (err) console.error(err);
          // saved!
          return res.json({ status: "Stalk request sent" });
        });
      } else {
        return res.json({ status: "Stalk request already sent" });
      }
    }
  );
});

module.exports = router;
