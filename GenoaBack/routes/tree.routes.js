const express = require("express");
const router = express.Router();
const { getTree } = require("../controllers/treeController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/:memberId", authMiddleware, requireRole("reader"), getTree);

module.exports = router;