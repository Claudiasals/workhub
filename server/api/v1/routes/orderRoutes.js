import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// All order routes require authentication
router.use(authUser);

// Create a new order
router.post("/", createOrder);

// Get all orders
router.get("/", getOrders);

// Get a single order by ID
router.get("/:id", getOrderById);

// Update an order by ID
router.put("/:id", updateOrder);

// Delete an order by ID
router.delete("/:id", deleteOrder);

export default router;
