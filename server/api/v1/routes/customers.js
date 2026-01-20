// routes/customers.js
import express from "express";
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customers.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// Get all customers (authenticated users)
router.get("/", authUser, getCustomers);

// Get customer by ID (authenticated users)
router.get("/:id", authUser, getCustomerById);

// Create a new customer (authenticated users)
router.post("/", authUser, createCustomer);

// Update customer by ID (authenticated users)
router.patch("/:id", authUser, updateCustomer);

// Delete customer by ID (authenticated users)
router.delete("/:id", authUser, deleteCustomer);

export default router;
