const express = require("express");

const {
  addBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  searchBooks,
  updateInventory
} = require("../controllers/bookController");

const auth =
  require("../middleware/auth");

const librarian =
  require("../middleware/librarian");

const validate =
  require("../middleware/validate");

const router = express.Router();

router.get(
  "/search",
  searchBooks
);

router.get(
  "/",
  getBooks
);

router.get(
  "/:id",
  getBook
);

router.post(
  "/",
  auth,
  librarian,
  validate([
    {
      field: "title",
      required: true,
      type: "string"
    },
    {
      field: "author",
      required: true,
      type: "string"
    },
    {
      field: "isbn",
      required: true,
      type: "string"
    },
    {
      field: "category",
      required: true,
      type: "string"
    },
    {
      field: "totalCopies",
      required: true,
      type: "number",
      min: 0
    },
    {
      field: "availableCopies",
      required: true,
      type: "number",
      min: 0
    }
  ]),
  addBook
);

router.put(
  "/:id",
  auth,
  librarian,
  updateBook
);

router.delete(
  "/:id",
  auth,
  librarian,
  deleteBook
);

router.put(
  "/:id/inventory",
  auth,
  librarian,
  validate([
    {
      field: "totalCopies",
      required: false,
      type: "number",
      min: 0
    },
    {
      field: "lostCopies",
      required: false,
      type: "number",
      min: 0
    },
    {
      field: "damagedCopies",
      required: false,
      type: "number",
      min: 0
    }
  ]),
  updateInventory
);

module.exports = router;