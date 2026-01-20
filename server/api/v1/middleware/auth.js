import { User } from "../../../db/index.js";
import { verifyAccessToken } from "../../../utils/auth.js";
import { handleRouteErrors } from "../../../utils/error.js";
import { formatResponse } from "../../../utils/format.js";

// JWT authentication middleware
export const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json(formatResponse(null, false, "Not authorized"));
    }

    // Extract token from header
    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      // Verify and decode JWT
      decoded = verifyAccessToken(token);
    } catch {
      return res
        .status(401)
        .json(formatResponse(null, false, "Invalid or expired token"));
    }

    // Load authenticated user without password
    const user = await User.findById(decoded._id, "-password").lean();

    if (!user) {
      return res
        .status(401)
        .json(formatResponse(null, false, "Not authorized"));
    }

    // Attach auth data to request
    req.user = user;
    req.token = {
      accessToken: token,
      decoded,
    };

    next();
  } catch (error) {
    return handleRouteErrors(res, { error });
  }
};
