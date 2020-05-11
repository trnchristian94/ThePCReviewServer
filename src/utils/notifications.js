const uploadNotification = async (
  fromUserId,
  toUserId,
  typeId,
  typeModel,
  messageCode,
  iconType
) => {
  const notification = new Notification({
    read: false,
    fromUser: fromUserId,
    toUser: toUserId,
    type: typeId,
    typeModel: typeModel,
    message: messageCode,
    iconType: iconType ? iconType : ""
  });
  await notification.save();
  console.log("Notification uploaded");
};

const removeNotification = async (
  fromUserId,
  toUserId,
  typeId,
  messageCode
) => {
  await Notification.findOneAndRemove(
    {
      fromUser: fromUserId,
      toUser: toUserId,
      type: typeId,
      message: messageCode
    },
    (err, response) => {
      if (err) console.error(err);
      if (response) {
        console.log("Notification removed");
      } else {
        console.log("Notification not found");
      }
    }
  );
};

module.exports = { uploadNotification, removeNotification };
