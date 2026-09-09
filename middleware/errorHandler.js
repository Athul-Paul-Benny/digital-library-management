const mongoose = require("mongoose");

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errorCode: "VALIDATION_ERROR",
      errors: Object.values(err.errors).map(
        error => error.message
      )
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(
      err.keyPattern || {}
    )[0];

    return res.status(409).json({
      success: false,
      message: `${field || "Record"} already exists`,
      errorCode: "DUPLICATE_ERROR"
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
      errorCode: "INVALID_ID"
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    errorCode: err.errorCode || "SERVER_ERROR"
  });
};

module.exports = errorHandler;