const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
//Hashing functions
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

//function register which pushes the name of the newUser information onto the array newUser
/*const register = (req, res) => {
  const newUser = { ...req.body }; // this makes a copy
*/
const register = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  //const {error, value} = userSchema.validate({name: "Bob", email: "nonsense", password: "password", favoriteColor: "blue"}, {abortEarly: false})
  if (error) {
    //return 400 if validation fails
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  //3. Check if user exists already using cleaned 'value.email')
  const existingUser = global.users.find((u) => u.email === value.email);
  if (existingUser) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "User already exists" });
  }
  //Hash password before storing
  //we wait for crypto library to finish hasing before we push user into global.users array
  const hashedPassword = await hashPassword(value.password);
  //4. For validate section use value to create the user replace req.body with value

  //const newUser = { ...value }; // this makes a copy
  const newUser = {
    name: value.name,
    email: value.email,
    password: hashedPassword, //store hashed pwd not plain text pwd
  };
  global.users.push(newUser);
  global.user_id = newUser; // After the registration step, the user is set to logged on.
  /*delete req.body.password;
  res.status(StatusCodes.CREATED).json(req.body);*/
  // return user without hash
  const { password, ...sanitizedUser } = value;
  //delete req.body.password;
  //res.status(StatusCodes.CREATED).json(req.body);
  res.status(StatusCodes.CREATED).json(sanitizedUser);
};

const logon = async (req, res) => {
  const { email, password } = req.body;
  const user = global.users.find(
    (person) => person.email === email?.toLowerCase(),
  );

  //if (user && user.password === password) {
  if (user && (await comparePassword(password, user.password))) {
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
  res.sendStatus(StatusCodes.OK).json({ message: "Logged Off" });
};
module.exports = { register, logon, logoff };
