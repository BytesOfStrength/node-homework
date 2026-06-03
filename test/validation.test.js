//add validation tests
const { userSchema } = require("../validation/userSchema");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

describe("user object validation tests", () => {
  //1.test whether the user object validation will accept a trivial password.
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    console.log("Joi Validation Error Response:", error);
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
  //2. The user schema requires that an email be specified.`
  it("2. email is specified", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "strongPassword" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 2:", error);
    expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });
  //3. The user schema does not accept an invalid email.
  it("3. email is invalid ", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "strongPassword", email: "@" },

      { abortEarly: false },
    );

    console.log("Joi validation error response 3:", error);

    expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });
  //4. The user schema requires a password.
  it("4. password is required ", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 4:", error);
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
  //5. The user schema requires name.
  it("5. name is required ", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "strongPassword" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 5:", error);
    expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });
  //6. The name must be valid (3 to 30 characters).
  it("6. name is longer than 3 characters and shorter than 30 ", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "strongPassword", name: "bo" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 6:", error);
    expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });
  //7. If validation is performed on a valid user object, error comes back falsy.
  it("7. user object is valid", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "strongPassword1!", name: "Bob" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 7:", error);
    expect(error).toBeFalsy();
  });
});

describe("task object validation tests", () => {
  //8. The task schema requires a title.
  it("8. task schema has required title", () => {
    const { error } = taskSchema.validate(
      { isCompleted: false, priority: "high" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 8:", error);
    expect(
      error.details.find((detail) => detail.context.key == "title"),
    ).toBeDefined();
  }); //closes the it() block
  //9. If an isCompleted value is specified, it must be valid.
  it("9. isCompleted value must be valid", () => {
    const { error } = taskSchema.validate(
      { title: "task1", priority: "high", isCompleted: "not a boolean" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 9:", error);
    expect(
      error.details.find((detail) => detail.context.key == "isCompleted"),
    ).toBeDefined();
  }); //closes the it() block

  //10. If an isCompleted value is not specified but the rest of the object is valid, a default of false is provided by validation.

  it("10. isCompleted with default value of false if other task object properties are valid", () => {
    const { value } = taskSchema.validate(
      { title: "task1" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 10:", value);
    expect(value.isCompleted).toBe(false);
  }); //closes the it() block
  //11. If isCompleted in the provided object has the value true, it remains true after validation.

  it("11. isCompleted has consistent value of true after validation", () => {
    const { value } = taskSchema.validate(
      { title: "task1", isCompleted: true },
      { abortEarly: false },
    );
    console.log("Joi validation response 11:", value);
    expect(value.isCompleted).toBe(true);
  }); //closes the it() block
}); //closes the describe block

//patchTask Schema validation tests
describe("patchSchema validation tests", () => {
  //12.patchTask Schema does not require a title
  it("12. patchTask schema does not require a title", () => {
    const { error } = patchTaskSchema.validate(
      { isCompleted: false, priority: "medium" },
      { abortEarly: false },
    );
    console.log("Joi validation error response 12:", error);
    //error should not occur so we expect it to be false in errors even if title is missing
    expect(error).toBeFalsy();
  }); //end of it block
  //13.If no value is provided for isCompleted this remains undefined in the returned value.
  it("13. patchTask schema returns value of undefined if isCompleted has no value", () => {
    const { value } = patchTaskSchema.validate(
      { priority: "medium" },
      { abortEarly: false },
    );
    console.log("Joi validation response 13:", value);
    //error should not occur so we expect it to be false in errors even if title is missing
    expect(value.isCompleted).toBeUndefined();
  }); //end of it block
}); //closes the describe block
