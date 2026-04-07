const express = require("express");
const router = express.Router();
const { getApprovedUsers, getPendingUsers, approveUser, rejectPendingUser, updateRole } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/", authMiddleware, requireRole("editor"), getApprovedUsers);
router.get("/pending", authMiddleware, requireRole("admin"), getPendingUsers);
router.patch("/:id/approve", authMiddleware, requireRole("admin"), approveUser);
router.delete("/:id/reject", authMiddleware, requireRole("admin"), rejectPendingUser);
router.patch("/:id/role", authMiddleware, requireRole("editor"), updateRole);

module.exports = router;
