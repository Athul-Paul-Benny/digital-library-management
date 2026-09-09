const express = require("express");

const {
  register,
  login,
  getProfile,
  updateProfile
} = require("../controllers/authController");

const auth =
  require("../middleware/auth");

const validate =
  require("../middleware/validate");

const router = express.Router();

router.post(
  "/register",
  validate([
    {
      field: "name",
      required: true,
      type: "string"
    },
    {
      field: "email",
      required: true,
      type: "string"
    },
    {
      field: "password",
      required: true,
      type: "string"
    }
  ]),
  register
);

router.post(
  "/login",
  validate([
    {
      field: "email",
      required: true,
      type: "string"
    },
    {
      field: "password",
      required: true,
      type: "string"
    }
  ]),
  login
);

router.get(
  "/profile",
  auth,
  getProfile
);

router.put(
  "/profile",
  auth,
  validate([
    {
      field: "name",
      required: false,
      type: "string"
    },
    {
      field: "email",
      required: false,
      type: "string"
    }
  ]),
  updateProfile
);

module.exports = router;