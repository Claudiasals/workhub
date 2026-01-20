import express from "express";
import {
  login,
  register,
  recoverPassword,
  enable2FA,
  disable2FA,
} from "../controllers/auth.js";
import { authUser } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/roles.js";

const router = express.Router();

// Public login endpoint
router.post("/login", login);

// Admin-only user registration
router.post("/register", authUser, requireAdmin, register);

// Public password recovery
router.post("/recover", recoverPassword);

// Enable 2FA for authenticated user
router.patch("/enable-2fa", authUser, enable2FA);

// Disable 2FA for authenticated user
router.patch("/disable-2fa", authUser, disable2FA);

export default router;
