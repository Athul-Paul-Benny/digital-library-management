const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["overdue"],
      default: "overdue"
    },

    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread"
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ memberId: 1 });

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);