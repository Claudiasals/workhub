import { formatResponse } from "../../../utils/format.js";

// Middleware that allows access only to admin users
export const requireAdmin = (req, res, next) => {
  // Ensure authenticated user exists and has admin role
  if (!req.user || req.user.role !== "admin") {
    return res
      .status(403)
      .json(formatResponse(null, false, "Admin privileges required"));
  }

  next();
};
