import { ApiError } from "../utils/ApiError.js";

export default function errorHandler(err, req, res, next) {
  console.error("ERROR HANDLER:", err);

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
      data: err.data || null
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal Server Error"
        : err.message || "Something went wrong",
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });
}
