// Controller for returning the authenticated user data

import { formatResponse } from "../../../utils/format.js";
import { handleRouteErrors } from "../../../utils/error.js";

// Get currently authenticated user
// GET /api/v1/me
export const getMe = async (req, res) => {
  try {
    // User data injected by authentication middleware
    const user = req.user;

    // Return current user information
    return res
      .status(200)
      .json(formatResponse({ user }, true, "Current user information"));
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
