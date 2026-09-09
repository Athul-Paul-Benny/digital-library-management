const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["student", "faculty"],
      required: true,
      unique: true
    },

    maxBooks: {
      type: Number,
      required: true,
      min: 1
    },

    loanDays: {
      type: Number,
      required: true,
      min: 1
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "MembershipPlan",
  membershipPlanSchema
);