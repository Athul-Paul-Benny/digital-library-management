const express = require("express");

const {
  placeHold,
  getMyHolds,
  getBookQueue
} = require("../controllers/holdController");

const auth =
  require("../middleware/auth");

const librarian =
  require("../middleware/librarian");

const validate =
  require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  auth,
  validate([
    {
      field: "bookId",
      required: true,
      type: "string"
    }
  ]),
  placeHold
);

router.get(
  "/my",
  auth,
  getMyHolds
);

router.get(
  "/book/:bookId",
  auth,
  librarian,
  getBookQueue
);

module.exports = router;