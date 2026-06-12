const express = require("express");
//L8 replace jwtMiddleware for auth.js
const jwt = require("../middleware/jwtMiddleware.js");
const router = express.Router();

const {
  bulkCreate,
  create,
  index,
  show,
  update,
  deleteTask,
  bulkDeleteTasks,
} = require("../controllers/taskController");
// post/api/tasks
//GET / - List tasks with pagination, eager loading, and search filter
//POST /  - Create single task
router.route("/").post(create).get(index);
//Lesson7 add bulkCreate route.  POST api/tasks/bulk Bulk create Task (createMany)
router.route("/bulk").post(bulkCreate);

//L11 add bulkDelete route GET api/tasks/bulkDelete
router.route("/bulk-delete").delete(bulkDeleteTasks);

//GET /:id -Show task with user info(eager loading), PATCH /:id -update task  DELETE /:id -Delete task
router.route("/:id").get(show).patch(update).delete(deleteTask);

module.exports = router;
