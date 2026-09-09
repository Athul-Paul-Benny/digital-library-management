const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    issueDate: {
      type: Date,
      default: Date.now
    },

    dueDate: {
      type: Date,
      required: true
    },

    returnDate: {
      type: Date,
      default: null
    },

    fine: {
      type: Number,
      default: 0,
      min: 0
    },

    finePaid: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["issued", "returned", "overdue"],
      default: "issued"
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ bookId: 1 });
transactionSchema.index({ memberId: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);