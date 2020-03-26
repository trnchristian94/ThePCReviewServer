const isOwnUser = (req, res) => {
  const userId = req.params.id ? req.params.id : req.body.userId;
  const authId = req.user.id;
  if (userId !== authId) {
    res.status(400).send({
      message: `You don't have access to use this request because you don't have permissions or you're not the own user.`
    });
    return false;
  }
  return true;
};

module.exports = { isOwnUser };
