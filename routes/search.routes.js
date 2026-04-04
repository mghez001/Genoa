const express = require("express");
const router = express.Router();
const { searchMembers } = require("../controllers/searchController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/members", authMiddleware, requireRole("reader"), searchMembers);

module.exports = router;