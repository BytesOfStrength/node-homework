class ValidationError extends Error {
  constructor(message) {
    super(message); //call the parent Error constructor with the message
    this.name = "ValidationError"; //set the error name (used for error id)
    this.statusCode = 400; //add custom property for HTTP status code
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

module.exports = {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
};
