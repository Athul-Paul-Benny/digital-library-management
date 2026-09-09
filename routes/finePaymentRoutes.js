const express = require("express");

const {
  payFine,
  getPayments
} = require("../controllers/finePaymentController");

const auth =
  require("../middleware/auth");

const validate =
  require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  auth,
  validate([
    {
      field: "transactionId",
      required: true,
      type: "string"
    },
    {
      field: "amount",
      required: true,
      type: "number",
      min: 0
    }
  ]),
  payFine
);

router.get(
  "/",
  auth,
  getPayments
);

module.exports = router;