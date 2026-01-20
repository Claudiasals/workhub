import express from "express";
import {
  listPointsOfSales,
  getPointOfSaleById,
  createPointOfSale,
  updatePointOfSale,
  deletePointOfSale,
} from "../controllers/pointOfSales.js";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Get all points of sale (authenticated users)
router.get("/", authUser, listPointsOfSales);

// Get a single point of sale by ID (admin only)
router.get("/:id", authUser, requireAdmin, getPointOfSaleById);

// Create a new point of sale (admin only)
router.post("/", authUser, requireAdmin, createPointOfSale);

// Update a point of sale by ID (admin only)
router.patch("/:id", authUser, requireAdmin, updatePointOfSale);

// Delete a point of sale by ID (admin only)
router.delete("/:id", authUser, requireAdmin, deletePointOfSale);

export default router;
