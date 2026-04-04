const express = require("express");
const router = express.Router();
const { getFamilyStats } = require("../controllers/statsController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/family", authMiddleware, requireRole("reader"), getFamilyStats);

module.exports = router;