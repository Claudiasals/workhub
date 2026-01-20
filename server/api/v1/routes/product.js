import express from "express";
import { listProducts, getProductById } from "../controllers/product.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// Get all products (authenticated users)
router.get("/", authUser, listProducts);

// Get a product by ID (authenticated users)
router.get("/:id", authUser, getProductById);

export default router;
