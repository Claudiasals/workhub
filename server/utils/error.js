import { formatResponse } from "./format.js";

// Centralized error handler for route controllers
export const handleRouteErrors = (res, { error, statusCode }) => {
  console.error(error);

  return res
    .status(statusCode || 500)
    .json(formatResponse(null, false, "Server error"));
};
