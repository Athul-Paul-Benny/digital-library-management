const admin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
      errorCode: "AUTHORIZATION_ERROR"
    });
  }

  next();
};

module.exports = admin;