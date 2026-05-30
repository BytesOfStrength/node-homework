//L9 added file
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; // point to the test database!
const prisma = require("../db/prisma");
const EventEmitter = require("events"); // L9 need to import event emitter because of create response with eventEmitter and importing events module from Node.js
const httpMocks = require("node-mocks-http");
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

//L9 beforeAll hook will empty the database and is used to create the user records needed. prisma.User.create to create a user instead of register function of the userController.js file
beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({
    data: { name: "Bob", email: "bob@sample.com", hashedPassword: "nonsense" },
  });
  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect(); //this is line is needed in order for Jest to terminate cleanly
});

describe("testing task creation", () => {
  it(" 14. cant create a task without a user id ", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  }); //closes the it block
  it(" 15. cant create a userId with a bogus id ", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "task with bad user" },
    });
    req.user = { id: 999999 };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class

    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  }); //closes the it block
  //16. If you have a valid user id, create() succeeds (res.statusCode should be 201).
  it(" 16. If you have a valid user id, create() succeeds", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "task1" },
    });
    req.user = { id: user1.id }; //this refers to Bob
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class

    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  }); //closes the it block
  //17. The object returned from the create() call has the expected title
  it(" 17. object returned from the create() call has the expected title", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("task1");
  }); //closes the it block
  //18.  The object has the right value for isCompleted
  it(" 18. object has right value for isCompleted", () => {
    //saveData = saveRes._getJSONData();//can get rid of this line because test 17 already got the data from the response of jsondata
    expect(saveData.isCompleted).toBe(false);
  }); //closes the it block
  //19.  The object does not have any value for userId
  it(" 19. userId is undefined", () => {
    saveTaskId = saveData.id; // the id is referring to the the id of the task in the task database
    expect(saveData.userId).toBeUndefined();
  }); //closes the it block
}); //closes the describe block
