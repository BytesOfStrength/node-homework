const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dogsRouter = require("./routes/dogs");

const app = express();
const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} = require("./errors.js");

// Your middleware here
//1.Request ID middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

//2.logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

//3.Security headers middleware Here. X-Content is the name, and nosniff is the value
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

//Body parsing middlewawer

app.use(express.json({ limit: "1mb" }));

//5.Content-Type validation middleware (for POST requests)
app.use((req, res, next) => {
  if (req.method === "POST") {
    const contentType = req.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
        requestId: req.requestId,
      });
    }
  }
  next();
});

//6.Routes (route handlers)
//app.use("URL/path", express.static("folder-path"))
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use("/", dogsRouter); // Do not remove this line

//7.Error handling middleware and 8. uses built in error handling
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name}: ${err.message}`);
  } else {
    console.error(`ERROR: Error: ${err.message}`);
  }
  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
});
//8 404 NOT Found handler
app.use((req, res, next) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});
const server = app.listen(3000, () =>
  console.log("Server listening on port 3000"),
);
module.exports = server;

/*const express = require("express");
const { v4: uuidv4 } = require("uuid");

const path = require("path");
const dogsRouter = require("./routes/dogs");
*/

/*app.use("/", dogsRouter); // Do not remove this line

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000"),
);
module.exports = server;*/
