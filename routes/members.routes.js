const express = require("express");
const router = express.Router();
const {
  createMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
  lockMember,
  unlockMember,
} = require("../controllers/memberController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, requireRole("editor"), createMember);
router.get("/", authMiddleware, requireRole("reader"), getMembers);
router.get("/:id", authMiddleware, requireRole("reader"), getMemberById);
router.patch("/:id", authMiddleware, requireRole("editor"), updateMember);
router.delete("/:id", authMiddleware, requireRole("editor"), deleteMember);
router.post("/:id/lock", authMiddleware, requireRole("editor"), lockMember);
router.post("/:id/unlock", authMiddleware, requireRole("editor"), unlockMember);

module.exports = router;