const express = require("express");
const router = express.Router();
const { createCouple, createChild } = require("../controllers/relationController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/couples", authMiddleware, requireRole("editor"), createCouple);
router.post("/children", authMiddleware, requireRole("editor"), createChild);

module.exports = router;