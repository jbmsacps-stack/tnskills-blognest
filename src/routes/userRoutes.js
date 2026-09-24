const express = require("express");
const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { listUsers, changeRole } = require("../controllers/userController");

const router = express.Router();
router.use(protect, requireRole("admin"));
router.get("/", listUsers);
router.patch("/:userId/role", changeRole);
module.exports = router;
