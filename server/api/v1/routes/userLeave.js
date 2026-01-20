import express from "express";
import {
  getUserLeaves,
  getUserLeavesByAdmin,
  createLeaveRequest,
  updateLeaveStatus,
  initUserLeave,
} from "../controllers/userLeave.js";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Get leave record of the authenticated user
router.get("/", authUser, getUserLeaves);

// Get leave record of a specific user (admin only)
router.get("/:userId", authUser, requireAdmin, getUserLeavesByAdmin);

// Create a new leave request (authenticated user)
router.post("/request", authUser, createLeaveRequest);

// Update leave request status (admin only)
router.patch("/:requestId/status", authUser, requireAdmin, updateLeaveStatus);

// Initialize leave record for an existing user (admin only)
router.post("/init/:userId", authUser, requireAdmin, initUserLeave);

export default router;
