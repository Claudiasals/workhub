// Builds a standardized API response object
export const formatResponse = (data, success = true, message = "OK") => {
  return {
    success,
    data,
    message,
  };
};
