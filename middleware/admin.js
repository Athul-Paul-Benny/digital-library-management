const admin = (req, res, next) => {
  if (!req.user || !["admin", "librarian"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }

  next();
};

module.exports = admin;