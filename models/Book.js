const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    author: {
      type: String,
      required: true,
      trim: true
    },

    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    totalCopies: {
      type: Number,
      required: true,
      min: 0
    },

    availableCopies: {
      type: Number,
      required: true,
      min: 0
    },

    lostCopies: {
      type: Number,
      default: 0,
      min: 0
    },

    damagedCopies: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ category: 1 });
bookSchema.index({ isbn: 1 });

module.exports = mongoose.model("Book", bookSchema);