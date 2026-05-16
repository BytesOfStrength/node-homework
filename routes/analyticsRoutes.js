const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();

const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController.js");
//add router.use(auth) before routes to protect them
router.use(auth);

//GET /api/analytics/users -Users with stats and pagination
router.route("/users").get(getUsersWithStats);

//GET /api/analytics/users/:id  - User analytics with groupBy operations
router.route("/users/:id").get(getUserAnalytics);
//GET /api/analytics/tasks/search -Task search with raw SQL
router.route("/tasks/search").get(searchTasks);

module.exports = router;
