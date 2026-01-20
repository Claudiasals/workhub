import express from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.js";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Get all events (authenticated users)
router.get("/", authUser, getAllEvents);

// Get event by ID (authenticated users)
router.get("/:id", authUser, getEventById);

// Create new event (admin only)
router.post("/", authUser, requireAdmin, createEvent);

// Update event by ID (admin only)
router.put("/:id", authUser, requireAdmin, updateEvent);

// Delete event by ID (admin only)
router.delete("/:id", authUser, requireAdmin, deleteEvent);

export default router;
