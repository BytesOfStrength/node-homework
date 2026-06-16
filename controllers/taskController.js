//Closure should be defined before the functions that use it
const { StatusCodes } = require("http-status-codes");
const {
  taskSchema,
  patchTaskSchema,
  taskPaginationSchema,
} = require("../validation/taskSchema");
const prisma = require("../db/prisma");

//POST / api / tasks / bulk;
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;
  //Validate the tasks array
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }
  //Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      //L8 remove global user_id
      userId: req.user.id,
    });
  }

  // Use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};
//need create POST /api/tasks
const create = async (req, res, next) => {
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  try {
    //Lesson 6: prisma.task.create
    const newTask = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted ?? false,
        //L8 remove global user_id
        userId: req.user.id,
        priority: value.priority ?? "medium",
      },
      //which columns to return which is the body of the response and make sure just like lesson 5 userId is not sent back in the response
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });
    res.status(StatusCodes.CREATED).json(newTask);
  } catch (err) {
    return next(err);
  }
};
//index GET /api/tasks
const index = async (req, res, next) => {
  const { error, value } = taskPaginationSchema.validate(req.query, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Pagination Error",
      message: error.message,
    });
  }
  try {
    const page = parseInt(value.page) || 1;
    const limit = parseInt(value.limit) || 10;
    const skip = (page - 1) * limit;
    //L8 remove global.user_id
    const whereClause = { userId: req.user.id };

    if (value.find) {
      whereClause.title = {
        contains: value.find, // Matches %find% pattern
        mode: "insensitive", // Case-insensitive search (ILIKE in PostgreSQL)
      };
    }
    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        title: true,
        isCompleted: true,
        id: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    // Get total count for pagination metadata
    const totalTasks = await prisma.task.count({
      where: whereClause,
    });
    const pagination = {
      page,
      limit,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limit),
      hasNext: page * limit < totalTasks,
      hasPrev: page > 1,
    };
    //L9 had to uncomment tasks.length === 0 to get status 400 for assignment9 testing
    if (tasks.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No tasks found" });
    }
    // Return tasks with pagination information
    res.status(200).json({
      tasks,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
};

//need show GET /api/task/:id
const show = async (req, res, next) => {
  const taskToFind = parseInt(req.params?.id);
  if (isNaN(taskToFind)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "That task ID is invalid" });
  }
  try {
    const task = await prisma.task.findUniqueOrThrow({
      where: {
        //L8 remove global.user_id
        id_userId: { id: taskToFind, userId: req.user.id },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Task was not found" });
    }
    return next(err);
  }
};
//need bulk update:
const bulkUpdateTasks = async (req, res, next) => {
  const { isCompleted } = req.query;

  // is there a query?
  if (isCompleted === undefined) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({
        error: "Please add ?isCompleted=true or ?isCompleted=false to the URL.",
      });
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "No update data in the request body.",
    });
  }
  const {error, value}= patchTaskSchema.validate(req.body, {abortEarly:false})
  if(error) {
    return res.status(StatusCodes.BAD_REQUEST).json({message: error.message});
  }
  try {
    const filterValue = isCompleted === "true"; //if string is true, filterValue is boolean True.
    //update command from prisma
    const result = await prisma.task.updateMany({
      where: {
        userId: req.user.id,
        isCompleted: filterValue,
      },
      data: value, //value post JOI validation schema
    });
    return res.status(StatusCodes.OK).json({
      message: "Bulk task update successful",
      tasksUpdated: result.count,
    });
    //send DB errors to Express error handler
  } catch (err) {
    return next(err);
  }
};

//need update
const update = async (req, res, next) => {
  if (!req.body) req.body = {};
  const taskToFind = parseInt(req.params?.id);
  //we get the index, not the task, so that we can splice it out
  if (isNaN(taskToFind)) {
    //if task doesn't exist
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid Task ID" });
  }
  //validate using patchTaskSchema
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id_userId: {
          id: taskToFind,
          //L8 remove global.user_id
          userId: req.user.id,
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
    });
    res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }
};
//need deleteTask using apt/tasks/:id
const deleteTask = async (req, res, next) => {
  const taskToFind = parseInt(req.params?.id); //if there are no params, the ? makes sure that you get a null

  if (isNaN(taskToFind)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }
  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskToFind,
          //L8 remove global.user_id
          userId: req.user.id,
        },
      },
      select: { title: true, isCompleted: true, id: true, priority: true },
    });
    res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The task was not found." });
    } else {
      return next(err);
    }
  }
};
//POST / api / tasks / bulk-delete;
const bulkDeleteTasks = async (req, res, next) => {
  const { ids } = req.body;
  //Validate the tasks array
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Invalid request data. Expected an array of task IDs.",
    });
  }
  // Use deleteMany for batch deletion and ensure if a string is entered, convert to int
  try {
    const numIds = ids.map((id) => parseInt(id, 10));
    const result = await prisma.task.deleteMany({
      where: {
        id: {
          in: numIds,
        },
        userId: req.user.id,
      },
    });

    res.status(200).json({
      //message: "success!",
      message: "Bulk task deletion successful",
      tasksDeleted: result.count,
      totalRequested: ids.length,
    });
  } catch (err) {
    return next(err);
  }
};
module.exports = {
  bulkCreate,
  create,
  index,
  show,
  update,
  deleteTask,
  bulkDeleteTasks,
  bulkUpdateTasks,
};
