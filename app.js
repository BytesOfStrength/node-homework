const express = require("express");
require("dotenv").config();
const prisma = require("./db/prisma");
const app = express();
//L8- Add cookieParser to extract cookies for authentication for signed JWT session tokens
const cookieParser = require("cookie-parser");
//L8 trust proxy is used to tell Express framework to trust secure connection. Ensures backend can accept and transmit secure, HttpOnly sesson cookies properly once app is deployed

app.set("trust proxy", 1);
const helmet = require("helmet"); //defense response headers (Content Security Policy)
const { xss } = require("express-xss-sanitizer"); //remove malicious scripts
const rateLimiter = require("express-rate-limit"); //defend against dOS and brute-force

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);
app.use(helmet());
app.use(cookieParser());
//L10 - increase express json payload to 1mb
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  console.log(
    `Request Method: ${req.method}, Request Path: ${req.path}, Request Query:`,
    req.query,
  );
  next();
});
app.use(xss());

const userRouter = require("./routes/userRoutes");
const jwtMiddleware = require("./middleware/jwtMiddleware.js");
const taskRouter = require("./routes/taskRoutes");
const analyticsRouter = require("./routes/analyticsRoutes");

//Lesson 6 removeconst pool = require("./db/pg-pool");

app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "not connected", error: err.message });
  }
});

app.use("/api/users", userRouter);
//L8 replace authMiddleware with jwtMiddleware
app.use("/api/tasks", jwtMiddleware, taskRouter);
app.use("/api/analytics", jwtMiddleware, analyticsRouter);

const notFound = require("./middleware/not-found.js");
app.use(notFound);

const errorHandler = require("./middleware/error-handler");
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`),
);
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
    // If you have DB connections, close them here
    //lesson 6 remove pool references await pool.end();
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});
module.exports = { app, server };
