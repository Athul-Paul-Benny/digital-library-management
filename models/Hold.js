const mongoose = require("mongoose");

const holdSchema = new mongoose.Schema(
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

    requestedAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: ["waiting", "fulfilled", "cancelled"],
      default: "waiting"
    }
  },
  {
    timestamps: true
  }
);

holdSchema.index({ bookId: 1 });
holdSchema.index({ memberId: 1 });

module.exports = mongoose.model("Hold", holdSchema);