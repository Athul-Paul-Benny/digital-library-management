const Hold = require("../models/Hold");
const Book = require("../models/Book");

exports.placeHold = async (
  req,
  res,
  next
) => {
  try {
    const {
      bookId
    } = req.body;

    const book = await Book.findById(
      bookId
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    if (book.availableCopies > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Book is available. Hold is not required."
      });
    }

    const existing = await Hold.findOne({
      bookId,
      memberId: req.user.userId,
      status: "waiting"
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a hold on this book"
      });
    }

    const hold = await Hold.create({
      bookId,
      memberId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: "Book hold placed successfully",
      data: hold
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyHolds = async (
  req,
  res,
  next
) => {
  try {
    const holds = await Hold.find({
      memberId: req.user.userId
    })
      .populate(
        "bookId",
        "title author category"
      )
      .sort({
        requestedAt: 1
      });

    res.json({
      success: true,
      count: holds.length,
      data: holds
    });
  } catch (error) {
    next(error);
  }
};

exports.getBookQueue = async (
  req,
  res,
  next
) => {
  try {
    const holds = await Hold.find({
      bookId: req.params.bookId,
      status: "waiting"
    })
      .populate(
        "memberId",
        "name email membershipId"
      )
      .sort({
        requestedAt: 1
      });

    res.json({
      success: true,
      count: holds.length,
      data: holds
    });
  } catch (error) {
    next(error);
  }
};