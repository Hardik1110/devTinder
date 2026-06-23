const jwt = require("jsonwebtoken");
const user = require("../models/user");

const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token not found");
    }
    const decoded = jwt.verify(token, "DEV@Tinder$790");

    const _id = decoded._id;
    const loggedInUser = await user.findById(_id);
    if (!loggedInUser) {
      throw new Error("User not found");
    }
    req.user = loggedInUser; // attach the user so routes can use req.user
    next();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = userAuth;
