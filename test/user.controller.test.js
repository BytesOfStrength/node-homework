require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");
const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { register, logoff, logon } = require("../controllers/userController");
const jwtMiddleware = require("../middleware/jwtMiddleware");
const jwt = require("jsonwebtoken");
const EventEmitter = require("events"); // L9 need to import event emitter because of create response with eventEmitter and importing events module from Node.js

// a few useful globals
let saveRes = null;
//let saveData = null;
let jwtCookie;

const cookie = require("cookie");
function MockResponseWithCookies() {
  const res = httpMocks.createResponse({
    eventEmitter: EventEmitter,
  });
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing logon, register, and logoff", () => {
  it("33. A user can be registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(201); // success!
  });
  it("34. The user can logon.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
  it("35. A string in the cookie array starts with 'jwt='", async () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toBeDefined();
  });
  it("36. That string contains 'HttpOnly;'", () => {
    expect(jwtCookie).toContain("HttpOnly;");
  });
  it("37. The returned data from the register has the expected name.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        name: "Alice",
        email: "alice@sample.com",
        password: "Pa$$word20",
      },
    });
    const registerRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, registerRes);
    const registerData = registerRes._getJSONData();

    expect(registerData.user.name).toBe("Alice"); // success!
  });
  it("38. The returned data contains a csrfToken.", async () => {
    const logonData = saveRes._getJSONData();

    expect(logonData.csrfToken).toBeDefined(); // success!
  });
  it("39.You can now logoff", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logoff, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("40. The logoff clears the cookie.", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toContain("Jan 1970");
  }); //closes it block
  //41. A logon attempt with a bad password returns a 401
  it("41. A logon attempt with a bad password returns a 401", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "badpassword" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  }); //closes it block
  //42. You can't register with an email address that is already registered.
  it("42. You can't register with an email address that is already registered.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "sam", email: "bob@sample.com", password: "badpassword" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(400);
  }); //closes it block
}); //closes describe block

describe("Testing JWT middleware", () => {
  let sharedRequest;
  it("61. jwtMiddleware Returns a 401 if the JWT cookie is not present in the req.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  }); //closes it block
  it("62. Returns a 401 if the JWT is invalid", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({ id: 5, csrfToken: "badToken" }, "badSecret", {
      expiresIn: "1h",
    });
    req.cookies = { jwt: jwtCookie };
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("63. Returns a 401 if the JWT is valid but the CSRF token isn't.", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    //sign cookie payload
    const jwtCookie = jwt.sign(
      { id: 5, csrfToken: "badToken" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    //matching header and cookie
    if (!req.headers) {
      req.headers = {};
    }
    req.headers["X-CSRF-TOKEN"] = "goodtoken";
    req.cookies = { jwt: jwtCookie };
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("64. Calls next() if both the token and the jwt are good", async () => {
    sharedRequest = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign(
      { id: 5, csrfToken: "goodtoken" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    if (!sharedRequest.headers) {
      sharedRequest.headers = {};
    }
    sharedRequest.headers["X-CSRF-TOKEN"] = "goodtoken";
    sharedRequest.cookies = { jwt: jwtCookie };
    const next = await waitForRouteHandlerCompletion(
      jwtMiddleware,
      sharedRequest,
      saveRes,
    );
    expect(next).toHaveBeenCalled();
  });
  it("65. if both the token and the jwt are good, req.user.id has the appropriate value.", () => {
    expect(sharedRequest.user.id).toBeDefined();
    expect(sharedRequest.user.id).toBe(5);
  });
});
