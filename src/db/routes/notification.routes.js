const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { getMessage } = require("../../utils/langUtil");

const { isOwnUser } = require("../../utils/permissions");

router.get("/:id", async (req, res) => {
  if (isOwnUser(req, res)) {
    await Notification.find({ toUser: req.params.id })
      .sort("-date")
      .populate("fromUser", "name userImage")
      .populate("toUser", "name userImage")
      .populate("type")
      .exec((err, response) => {
        if (err) console.log(err);
        var notifications = [];
        for (let i = 0; i < response.length; i++) {
          if (
            response[i].type !== null &&
            response[i].fromUser !== null &&
            response[i].toUser !== null
          ) {
            notifications.push({
              message: getMessage(response[i].message, "en", response[i]),
              fromUser: response[i].fromUser,
              toUser: response[i].toUser,
              date: response[i].date,
              type: response[i].type,
              iconType: response[i].iconType,
              typeModel: response[i].typeModel
            });
          } else if (
            response[i].type === null ||
            response[i].fromUser === null ||
            response[i].toUser === null
          ) {
            Notification.findByIdAndRemove(response[i].id, (err, response) => {
              if (err) console.error(err);
            });
          }
        }
        res.json(notifications);
        Notification.updateMany(
          { toUser: req.params.id },
          { $set: { read: true } },
          { multi: true },
          (err, writeResult) => {
            if (err) console.log(err);
          }
        );
      });
  }
});

router.get("/:id/amount", async (req, res) => {
  if (isOwnUser(req, res)) {
    await Notification.find({ toUser: req.params.id, read: false }).exec(
      (err, response) => {
        if (err) console.log(err);
        res.json({ newNotifications: response.length });
      }
    );
  }
});

module.exports = router;
