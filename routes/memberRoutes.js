const express = require("express");

const {
  createPlan,
  getPlans,
  getMemberHistory
} = require("../controllers/memberController");

const auth =
  require("../middleware/auth");

const librarian =
  require("../middleware/librarian");

const validate =
  require("../middleware/validate");

const router = express.Router();

router.get(
  "/plans",
  auth,
  getPlans
);

router.post(
  "/plans",
  auth,
  librarian,
  validate([
    {
      field: "type",
      required: true,
      type: "string"
    },
    {
      field: "maxBooks",
      required: true,
      type: "number",
      min: 1
    },
    {
      field: "loanDays",
      required: true,
      type: "number",
      min: 1
    }
  ]),
  createPlan
);

router.get(
  "/:id/history",
  auth,
  getMemberHistory
);

module.exports = router;