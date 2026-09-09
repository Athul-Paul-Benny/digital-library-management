const express = require("express");

const {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows
} = require("../controllers/borrowController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  auth,
  validate(["bookId", "dueDate"]),
  borrowBook
);

router.put(
  "/:id/return",
  auth,
  returnBook
);

router.get(
  "/my",
  auth,
  getMyBorrows
);

router.get(
  "/",
  auth,
  admin,
  getAllBorrows
);

module.exports = router;