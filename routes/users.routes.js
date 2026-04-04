const express = require("express");
const router = express.Router();
const { getPendingUsers, approveUser, updateRole } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/pending", authMiddleware, requireRole("admin"), getPendingUsers);
router.patch("/:id/approve", authMiddleware, requireRole("admin"), approveUser);
router.patch("/:id/role", authMiddleware, requireRole("admin"), updateRole);

module.exports = router;