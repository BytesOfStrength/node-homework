//1. Call for the built in emitter from Node.js
const EventEmitter = require("events");

//define the instance
const timeEmitter = new EventEmitter();

//LISTENERs must be listed prior to Emitter and exports
timeEmitter.on("time", (message) => {
  // this registers a listener
  console.log("Time received: " + message);
});

timeEmitter.on("error", (error) => {
  //listener for errors
  console.log("the emitter has an error", error.message);
});

setInterval(() => {
  const currentTime = new Date().toLocaleTimeString();
  timeEmitter.emit("time", currentTime);
}, 5000);

module.exports = timeEmitter;
