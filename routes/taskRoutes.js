const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

const {
  bulkCreate,
  create,
  index,
  show,
  update,
  deleteTask,
} = require("../controllers/taskController");

router.use(auth);
// post/api/tasks
//GET / - List tasks with pagination, eager loading, and search filter
//POST /  - Create single task
router.route("/").post(create).get(index);
//Lesson7 add bulkCreate route.  POST api/tasks/bulk Bulk create Task (createMany)
router.route("/bulk").post(bulkCreate);
//GET /:id -Show task with user info(eager loading), PATCH /:id -update task  DELETE /:id -Delete task
router.route("/:id").get(show).patch(update).delete(deleteTask);

module.exports = router;
