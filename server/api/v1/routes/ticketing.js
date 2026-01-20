import express from "express";
import {
  getAllTickets,
  getItemById,
  createTickets,
  updateTickets,
  deleteTickets,
} from "../controllers/ticketing.js";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Create a new ticket (authenticated users)
router.post("/", authUser, createTickets);

// Get all tickets (authenticated users)
router.get("/", authUser, getAllTickets);

// Get a single ticket by ID (authenticated users)
router.get("/:id", authUser, getItemById);

// Update a ticket by ID (admin only)
router.put("/:id", authUser, requireAdmin, updateTickets);

// Delete a ticket by ID (admin only)
router.delete("/:id", authUser, requireAdmin, deleteTickets);

export default router;
