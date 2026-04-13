const express = require("express");
const router = express.Router();
const { getCouples, createCouple, createChild } = require("../controllers/relationController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/couples", authMiddleware, requireRole("reader"), getCouples);
router.post("/couples", authMiddleware, requireRole("editor"), createCouple);
router.post("/children", authMiddleware, requireRole("editor"), createChild);

module.exports = router;
