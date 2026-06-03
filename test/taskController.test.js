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
  it("14. cant create a task without a user id ", async () => {
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
  it("15. cant create a userId with a bogus id ", async () => {
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
  it("16. If you have a valid user id, create() succeeds", async () => {
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
  it("17. object returned from the create() call has the expected title", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("task1");
  }); //closes the it block
  //18.  The object has the right value for isCompleted
  it("18. object has right value for isCompleted", () => {
    //saveData = saveRes._getJSONData();//can get rid of this line because test 17 already got the data from the response of jsondata
    expect(saveData.isCompleted).toBe(false);
  }); //closes the it block
  //19.  The object does not have any value for userId
  it("19. userId is undefined", () => {
    saveTaskId = saveData.id; // the id is referring to the the id of the task in the task database
    expect(saveData.userId).toBeUndefined();
  }); //closes the it block
}); //closes the describe block

//task retrieval and read access control
describe("test getting created tasks", () => {
  //20. You can't get a list of tasks without a user id. Similiar to format of Test 14
  it("20. You can't get a list of tasks without a user id.", async () => {
    expect.assertions(1);
    const req = httpMocks.createRequest({
      method: "GET",
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class

    try {
      await waitForRouteHandlerCompletion(index, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  //21. If you use user1's id on index() the call returns a 200 status.
  it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  //22. The returned object has a tasks array of length 1
  it("22. The returned object has a tasks array of length 1.", async () => {
    saveData = saveRes._getJSONData(); // reusing saveRes
    expect(saveData.tasks.length).toBe(1);
  });
  //23. The title in the first array object is as expected.
  it("23. title in first array object or tasks is as expected", () => {
    expect(saveData.tasks[0].title).toBe("task1");
  });
  //24.The first array object does not contain a userId
  it("24. The first array object does not contain a userId ", () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });
  /*25. If you get the list of tasks using the userId from user2, you get a 404. similar to Test21
(This is a security test for access control!  You do not want Alice to access Bob's data!)*/
  it("25. ensure user2 unable to get list of tasks of user1 and return 404", async () => {
    //expect.assertions(1);//don't need this line because checking status code
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
  //26.You can retrieve the created task using show().
  it("26. You can retrieve the created task using show()", async () => {
    //expect.assertions(1);//don't need this line because checking status code
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  //27. User2 (Alice) can't retrieve this task entry. You should get a 404
  it("27. User2 can't retrieve this task entry. You should get a 404", async () => {
    //expect.assertions(1);//don't need this line because checking status code
    const req = httpMocks.createRequest({
      //Alice is trying to see Bob's specific task
      method: "GET",
    });
    req.user = { id: user2.id }; //Alice is logged in
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(404); //Alice is blocked from Bob's specific task
  });
}); //closes the describe block
describe("test updating and deleting tasks as well as write-access control", () => {
  //28. User1 can set the task corresponding to saveTaskId to isCompleted: true
  it("28. User1 can set the task corresponding to saveTaskId to isCompleted: true", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });
    req.user = { id: user1.id }; //Bob is logged in
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(update, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
    const updateData = saveRes._getJSONData(); // reusing saveRes
    expect(updateData.isCompleted).toBe(true);
  });
  //29 User2 can't update task corresponding to user1's savetaskId to isCompleted: true
  it("29.User2 can't update task corresponding to user1's savetaskId to isCompleted: true", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      body: { isCompleted: true },
    });
    req.user = { id: user2.id }; //Alice is logged in
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(update, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  }); //closes it block
  //30 User2 can't delete this task.
  it("30. User2 can't delete user1's task", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user2.id }; //Alice is logged in
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
    //const updateData = saveRes._getJSONData(); // reusing saveRes
  }); //closes it block
  //31. User1 can delete this task.
  it("31. User1 can delete this task which is User1's", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
    });
    req.user = { id: user1.id }; //Alice is logged in
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(deleteTask, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
    //const updateData = saveRes._getJSONData(); // reusing saveRes
  }); //closes it block

  //32. Retrieving user1's tasks now returns a 404. This is because User1 deleted his only task
  it("32. Retrieving user1's tasks now returns a 404", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id }; //Alice is logged in
    req.params = { id: saveTaskId.toString() };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
    //const updateData = saveRes._getJSONData(); // reusing saveRes
  }); //close it block
}); //closes describe block
