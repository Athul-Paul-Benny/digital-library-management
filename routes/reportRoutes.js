const express = require("express");

const {
  overdueReport,
  mostBorrowed,
  inventoryReport
} = require("../controllers/reportController");

const auth =
  require("../middleware/auth");

const librarian =
  require("../middleware/librarian");

const router = express.Router();

router.get(
  "/overdue",
  auth,
  librarian,
  overdueReport
);

router.get(
  "/most-borrowed",
  auth,
  librarian,
  mostBorrowed
);

router.get(
  "/inventory",
  auth,
  librarian,
  inventoryReport
);

module.exports = router;