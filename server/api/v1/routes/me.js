import express from "express";
import { getMe } from "../controllers/me.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// Get current authenticated user
router.get("/", authUser, getMe);

export default router;
