const getMessage = (code, lang, info) => {
  var json = require("../i18n/" + lang.toUpperCase() + "/i18n.json");
  if (info) {
    return formatMessage(json[code], info);
  }
  return json[code];
};

const formatMessage = (message, info) => {
  var fromUserName = info.fromUser._doc ? info.fromUser._doc.name : "";
  //var toUserName = info.toUser._doc ? info.toUser._doc.name : "";
  switch (info.typeModel) {
    case "Post":
      var text = info.type._doc.text;
      return eval("`" + message + "`");
    default:
      return eval("`" + message + "`");
  }
};
module.exports = { getMessage };
