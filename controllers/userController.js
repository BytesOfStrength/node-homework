const { StatusCodes } = require("http-status-codes");
const { userSchema } = require("../validation/userSchema");
const prisma = require("../db/prisma");
//const pool = require("../db/pg-pool");
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
const register = async (req, res, next) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    //return 400 if validation fails
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  //3. Check if user exists already using cleaned 'value.email')
  //L7 let user = null;
  value.hashedPassword = await hashPassword(value.password);
  delete value.password;

  // the code to here is like the in-memory version
  try {
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: value, // this uses name, email, and hashedPassword from 'value'
        select: { name: true, email: true, id: true, createdAt: true },
      });
      //Lesson 7 simulate Rollback Temp code for assignment: for task failure
      //throw new Error("Simulated Welcome Task Failure");

      const welcomeTasksData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTasksData });

      //Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTasksData.map((t) => t.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true,
        },
      });
      return { user: newUser, welcomeTasks };
    });
    // 6. Success! (The 'user' variable is accessible here because of 'let user = null')
    global.user_id = result.user.id;
    res.status(StatusCodes.CREATED).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
      /*name: user.name,
      email: user.email,*/
    });
  } catch (err) {
    // 5. Handle the Prisma-specific error code for "Unique constraint"
    //if (err.name === "PrismaClientKnownRequestError" && err.if code === "P2002") {
    if (err.code === "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Email already registered" });
      //.json({ message: "User already exists" });
    } //All changes rolled back
    return next(err);
  }
};
//L7 I removed pool query here from lesson5
/*in Lesson 5b we remove using a loop function to find if the user is existing 
  //4. For validate section use value to create the user replace req.body with value

  //const newUser = { ...value }; // this makes a copy
  const newUser = {
    name: value.name,
    email: value.email,
    password: hashedPassword, //store hashed pwd not plain text pwd
  };
 */

const logon = async (req, res, next) => {
  const { email, password } = req.body;
  const lowCaseEmail = email?.toLowerCase();
  try {
    const user = await prisma.user.findUnique({
      where: { email: lowCaseEmail },
    });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Failed" });
    }
    const isMatched = await comparePassword(password, user.hashedPassword);

    if (isMatched) {
      global.user_id = user.id;
      res.status(StatusCodes.OK).json({ name: user.name, email: user.email });
    } else {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Authentication Failed." });
    }
  } catch (e) {
    return next(e);
  }
};

const logoff = (req, res) => {
  global.user_id = null;
  res.sendStatus(StatusCodes.OK);
};
module.exports = { register, logon, logoff };
