import express from "express";
import {
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePasswordByEmail,
} from "../controllers/users.js";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Change password of the authenticated user
router.patch("/password", authUser, changePasswordByEmail);

// Get all users (admin only)
router.get("/", authUser, requireAdmin, listUsers);

// Get user by ID (admin only)
router.get("/:id", authUser, requireAdmin, getUserById);

// Update user by ID (admin only)
router.patch("/:id", authUser, requireAdmin, updateUser);

// Delete user by ID (admin only)
router.delete("/:id", authUser, requireAdmin, deleteUser);

export default router;
