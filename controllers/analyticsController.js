//hmwk
const prisma = require("../db/prisma");
const { StatusCodes } = require("http-status-codes");
const {
  analyticsPaginationSchema,
  analyticsSearchSchema,
} = require("../validation/analyticsSchema");

//GET /api/analytics/users/:id

const getUserAnalytics = async (req, res, next) => {
  try {
    // Parse and validate user ID
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "That user ID is invalid." });
    }
    //validation for if the user already exists 404 check required as per Lesson7
    const existingUserId = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUserId) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "That user is not found." });
    }

    // Use groupBy to count tasks by completion status

    const taskStats = await prisma.task.groupBy({
      by: ["isCompleted"],
      where: { userId },
      _count: {
        id: true,
      },
    });

    // Include recent task activity with eager loading (user info)
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
        User: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Calculate weekly progress using groupBy
    // First, calculate the date from one week ago
    // Hint: Use new Date() and setDate() to subtract 7 days
    /*const date = new Date('2024-05-15');
date.setDate(25);//changes day to the 25th
console.log(date);*/
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    // Then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
    const weeklyProgress = await prisma.task.groupBy({
      by: ["createdAt"],
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
      _count: { id: true },
    });
    res.status(StatusCodes.OK).json({
      taskStats,
      recentTasks,
      weeklyProgress,
    });
  } catch (err) {
    return next(err);
  }
};

const getUsersWithStats = async (req, res, next) => {
  //validate query parameters with Joi
  const { error, value } = analyticsPaginationSchema.validate(req.query, {
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

    /*validation for pagination 
    if (page < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Pagination Error",
        message: "Page must be 1 or greater."
      });
    }if (limit< 1 || limit > 100){
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Pagination Error",
        message: " Limit needs to be between 1 and 100."
      });
    }*/
    const skip = (page - 1) * limit;
    //const whereClause = { userId: global.user_id };

    /*if (req.query.find) {
      whereClause.id = {
        contains: req.query.find, // Matches %find% pattern
        mode: "insensitive", // Case-insensitive search (ILIKE in PostgreSQL)
      };
    }*/

    //Filtering  and sorting inside include : For video submission
    const usersRaw = await prisma.user.findMany({
      include: {
        Task: {
          where: { isCompleted: false }, //incompleted tasks only
          select: { id: true, title: true, priority: true },
          take: 5, //limit of 5 tasks
        },
        _count: {
          select: {
            Task: true,
          },
        },
      },
      skip: skip,
      take: limit,
      orderBy: { createdAt: "desc" }, //newest first
    });
    //Transform to only include fields we want
    const users = usersRaw.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      _count: user._count,
      Task: user.Task,
    }));
    //Get total count for pagination
    const totalUsers = await prisma.user.count();

    //Build pagination object with page, limit, total, pages, hasNext, hasPrev
    //Hint: use Math.ceil() for pages, compare page * limit with total for hasNext

    const pagination = {
      page,
      limit,
      total: totalUsers,
      pages: Math.ceil(totalUsers / limit),
      hasNext: page * limit < totalUsers,
      hasPrev: page > 1,
    };
    //Return users and pagination
    res.status(StatusCodes.OK).json({
      users,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
};

//GET /api/analytics/tasks/search
const searchTasks = async (req, res, next) => {
  const { error, value } = analyticsSearchSchema.validate(req.query, {
    abortEarly: false,
  });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Validation Error",
      message: error.message,
    });
  }
  try {
    //Get Search term for q
    const searchQuery = value.q;
    //validate search query
    /*REMOVE BECAUSE OF JOI validation with separate schema file if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Search query must be at least 2 characters long",
      });
    }*/
    const limit = parseInt(value.limit) || 20;

    //Lesson7: Limit validation on searches
    /*if (limit < 1 || limit > 100) {
     return res.status(StatusCodes.BAD_REQUEST).json({
       error: "Pagination Error",
       message: " Limit needs to be between 1 and 100.",
     });
   }*/
    // Construct search patterns outside the query for proper parameterization
    const searchPattern = `%${searchQuery}%`;
    const exactMatch = searchQuery;
    const startsWith = `${searchQuery}%`;

    // Use raw SQL for complex text search with parameterized queries
    const searchResults = await prisma.$queryRaw`
  SELECT 
    t.id,
    t.title,
    t.is_completed as "isCompleted",
    t.priority,
    t.created_at as "createdAt",
    t.user_id as "userId",
    u.name as "user_name"
  FROM tasks t
  JOIN users u ON t.user_id = u.id
  WHERE t.title ILIKE ${searchPattern} 
     OR u.name ILIKE ${searchPattern}
  ORDER BY 
    CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startsWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT ${parseInt(limit)}
`;

    // Return results with query and count
    res.status(StatusCodes.OK).json({
      results: searchResults,
      query: searchQuery, //returns the searchTerm
      count: searchResults.length,
    });
  } catch (err) {
    // if SQL is not formed correctly or incorrect table name, use global error handler
    return next(err);
  }
};

module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };
