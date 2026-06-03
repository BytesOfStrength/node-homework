require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma");
let agent;
//let saveRes;
const { app, server } = require("../app");

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user ", () => {
  let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    //L9 the api for register route uses the endpoint /api/users/register not /user in the route as per app.js
    // saveRes is the object returned
    saveRes = await agent.post("/api/users/register").send(newUser);
    expect(saveRes.status).toBe(201);
  });
  //47. Registration returns an object with the expected name.
  it("47. Registration returns an object with the expected name.", () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  }); //closes the it block
  it("48. Test that the returned object includes a csrfToken", () => {
    /*don't need let csrfToken and associating with the response body because expect() is looking at it directly
    let csrfToken;
    csrfToken = saveRes.body.csrfToken;*/
    expect(saveRes.body.csrfToken).toBeDefined();
  }); //closes the it block
  //49. You can logon as the newly registered user.
  it("49. You can logon as the newly registered user.", async () => {
    saveRes = await agent.post("/api/users/logon").send({
      email: "jdeere@example.com",
      password: "Pa$$word20",
    });
    expect(saveRes.status).toBe(200);
  }); // close it block
  //50. Verify that you are logged in: /api/tasks should not return a 401
  //since the supertest saves the cookies, i don't need to resend the credentials to log in and see tasks
  it("50. Verify that you are logged in: /api/tasks should not return a 401", async () => {
    saveRes = await agent.get("/api/tasks");
    expect(saveRes.status).toBe(200);
  }); // close it block
  it("51.Verify that you can log out", async () => {
    saveRes = await agent.post("/api/users/logoff");
    expect(saveRes.status).toBe(200);
  }); // close it block
  //52.Make sure that you are really logged out: /api/tasks should now return a 401

  it("52. Make sure that you are really logged out: /api/tasks should now return a 401", async () => {
    saveRes = await agent.get("/api/tasks");

    expect(saveRes.status).toBe(401);
  }); // close it block
}); //close describe block
