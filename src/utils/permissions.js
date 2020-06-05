const isOwnUser = (req, res) => {
  const userId = req.params.id ? req.params.id : req.body.userId;
  const authId = req.user.id;
  if (userId !== authId) {
    res.status(400).send({
      status: `You don't have access to use this request because you don't have permissions or you're not the own user.`
    });
    return false;
  }
  return true;
};

const isAdmin = (req) => {
  return req.user.permission === "admin";
};

const getActiveUsers = async () => {
  const activeUsers = await User.find({
    active: { $ne: false }
  });
  const idActives = [];
  for (let i = 0; i < activeUsers.length; i++) {
    idActives.push(activeUsers[i].id);
  }
  return idActives;
};

module.exports = { isOwnUser, isAdmin, getActiveUsers };
