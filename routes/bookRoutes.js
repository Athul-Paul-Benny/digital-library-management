const express = require("express");

const {
  addBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  searchBooks
} = require("../controllers/bookController");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  auth,
  admin,
  validate([
    "title",
    "author",
    "category",
    "isbn",
    "quantity",
    "availableQuantity"
  ]),
  addBook
);

router.get("/", getBooks);
router.get("/search", searchBooks);
router.get("/:id", getBook);

router.put("/:id", auth, admin, updateBook);
router.delete("/:id", auth, admin, deleteBook);

module.exports = router;