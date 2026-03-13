/*
  Send a standardized success response
 */
const sendSuccess = (res, statusCode = 200, message = "Success", data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/*
 Send a standardized error response
 */
const sendError = (res, statusCode = 500, message = "Internal Server Error", error = null) => {
  const response = {
    success: false,
    message
  };
  if (error && process.env.NODE_ENV !== "production") {
    response.error = error;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
