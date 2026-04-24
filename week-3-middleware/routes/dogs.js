const express = require("express");
const router = express.Router();
const dogs = require("../dogData.js");
const { ValidationError, NotFoundError } = require("../errors");
router.get("/dogs", (req, res) => {
  res.json(dogs);
});

router.post("/adopt", (req, res, next) => {
  const { name, address, email, dogName } = req.body;
  if (!name || !email || !dogName) {
    throw new ValidationError("Missing required fields");
    /*return res.status(400).json({ error: "All fields are required" });*/
  }
  const dog = dogs.find((doggie) => doggie.name === dogName);
  //custom error
  if (!dog || dog.status !== "available") {
    throw new NotFoundError("Dog not found or not available");
  }
  return res.status(201).json({
    message: `Adoption request received. We will contact you at ${email} for further details.`,
  });
});

router.get("/error", (req, res, next) => {
  throw new Error("Test error");
});

module.exports = router;
