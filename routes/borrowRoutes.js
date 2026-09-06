const express = require("express");

const {
  borrowBook,
  returnBook,
  myBorrows,
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

router.put("/:id/return", auth, returnBook);

router.get("/my", auth, myBorrows);

router.get("/", auth, admin, getAllBorrows);

module.exports = router;