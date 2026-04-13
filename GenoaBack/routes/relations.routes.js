const express = require("express");
const router = express.Router();
const { getCouples, getChildren, createCouple, createChild } = require("../controllers/relationController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/couples", authMiddleware, requireRole("reader"), getCouples);
router.post("/couples", authMiddleware, requireRole("editor"), createCouple);
router.get("/children", authMiddleware, requireRole("reader"), getChildren);
router.post("/children", authMiddleware, requireRole("editor"), createChild);

module.exports = router;
