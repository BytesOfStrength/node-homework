const { StatusCodes } = require("http-status-codes");

//function register which pushes the name of the newUser information onto the array newUser
const register = (req, res) => {
  const newUser = { ...req.body }; // this makes a copy
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  delete req.body.password;
  res.status(StatusCodes.CREATED).json(req.body);
};
const logon = (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find((person) => person.email === email);

  if (user && user.password === password) {
    global.user_id = user;
    //key portion is from the JSON object information for the body we provided via postman
    res.status(StatusCodes.OK).json({ name: user.name, email: user.email });
  } else {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed. " });
  }
};

const logoff = (req, res) => {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
};
module.exports = { register, logon, logoff };
