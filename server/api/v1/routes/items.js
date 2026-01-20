import express from "express";
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  updateItemQuantity,
} from "../controllers/items.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// Create a new item
router.post("/", createItem);

// Get all items (authenticated users)
router.get("/", authUser, getAllItems);

// Get item by ID
router.get("/:id", getItemById);

// Update item by ID
router.put("/:id", updateItem);

// Update item stock quantity (atomic increment)
router.patch("/:id/quantity", updateItemQuantity);

// Delete item by ID
router.delete("/:id", deleteItem);

export default router;
