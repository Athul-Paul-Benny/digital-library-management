const librarian = (req, res, next) => {
  if (
    !req.user ||
    !["librarian", "admin"].includes(req.user.role)
  ) {
    return res.status(403).json({
      success: false,
      message: "Librarian or Admin access required",
      errorCode: "AUTHORIZATION_ERROR"
    });
  }

  next();
};

module.exports = librarian;