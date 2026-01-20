import express from "express";
import {
  getAllShifts,
  getShiftsByUser,
  updateShift,
  deleteShift,
} from "../controllers/userShift.js";

import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Get all users' shifts (admin only)
router.get("/", authUser, requireAdmin, getAllShifts);

// Get shifts for a specific user (user: own shifts, admin: any user)
router.get("/:userId", authUser, getShiftsByUser);

// Update a shift document (admin only)
router.patch("/:id", authUser, requireAdmin, updateShift);

// Delete a shift document (admin only)
router.delete("/:id", authUser, requireAdmin, deleteShift);

export default router;
