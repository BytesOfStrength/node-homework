//Closure should be defined before the functions that use it
const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

//need create
const create = (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  const newTask = {
    //...req.body, (remove and replace with value for validation section leson 4)
    ...value,
    id: taskCounter(),
    userId: global.user_id.email,
  };
  global.tasks.push(newTask);
  const { userId, ...sanitizedTask } = newTask;
  //we don't send back userId! this statement removes it.
  res.status(StatusCodes.CREATED).json(sanitizedTask);
};
//index GET /api/tasks
const index = (req, res) => {
  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );
  if (userTasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }
  //Sanitize the list
  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });
  res.status(StatusCodes.OK).json(sanitizedTasks);
};
//need show GET /api/task/:id
const show = (req, res) => {
  const taskToFind = parseInt(req.params?.id);
  if (!taskToFind) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "That task ID is invalid" });
  }
  const task = global.tasks.find(
    (task) => task.id === taskToFind && task.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Task was not found",
    });
  }
  const { userId, ...sanitizedTask } = task;
  res.status(StatusCodes.OK).json(sanitizedTask);
};
//need update
const update = (req, res) => {
  if (!req.body) req.body = {};
  const taskToFind = parseInt(req.params?.id);
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskToFind && task.userId === global.user_id.email,
  );
  //we get the index, not the task, so that we can splice it out
  if (taskIndex === -1) {
    //if task doesn't exist
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  //validate using patchTaskSchema
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  //Object. assign using Hint 2
  //for Lesson4 validation section replace req.body to value
  Object.assign(global.tasks[taskIndex], value);
  const { userId, ...sanitizedTask } = global.tasks[taskIndex];
  res.status(StatusCodes.OK).json(sanitizedTask);
};
//need deleteTask using apt/tasks/:id
const deleteTask = (req, res) => {
  const taskToFind = parseInt(req.params?.id); //if there are no params, the ? makes sure that you get a null

  if (!taskToFind) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  const taskIndex = global.tasks.findIndex(
    (task) => task.id === taskToFind && task.userId === global.user_id.email,
  );
  //we get the index, not the task, so that we can splice it out
  if (taskIndex === -1) {
    //if task doesn't exist
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }
  //else it is a 404
  const { userId, ...task } = global.tasks[taskIndex];
  //pull userId out and keep a copy of everything else, so the response is sanitized
  global.tasks.splice(taskIndex, 1); //do the delete
  return res.status(StatusCodes.OK).json(task); // return the deleted entry without its userId. the default status code, OK, is returned
};
module.exports = { create, index, show, update, deleteTask };
