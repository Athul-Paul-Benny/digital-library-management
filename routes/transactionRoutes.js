const express = require("express");

const {
  issueBook,
  returnBook,
  getMyTransactions,
  getAllTransactions,
  updateOverdueTransactions
} = require("../controllers/transactionController");

const auth =
  require("../middleware/auth");

const librarian =
  require("../middleware/librarian");

const validate =
  require("../middleware/validate");

const router = express.Router();

router.post(
  "/issue",
  auth,
  validate([
    {
      field: "bookId",
      required: true,
      type: "string"
    }
  ]),
  issueBook
);

router.put(
  "/:id/return",
  auth,
  returnBook
);

router.get(
  "/my",
  auth,
  getMyTransactions
);

router.get(
  "/",
  auth,
  librarian,
  getAllTransactions
);

router.post(
  "/update-overdue",
  auth,
  librarian,
  updateOverdueTransactions
);

module.exports = router;