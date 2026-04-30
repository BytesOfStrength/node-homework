const { StatusCodes } = require("http-status-codes");

const auth = (req, res, next) => {
  console.log("Auth middleware: Current global.user_id is", global.user_id);
  //if global.user_id is null, undefined
  if (!global.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "unauthorized" });
  }
  next();
};
module.exports = auth;
