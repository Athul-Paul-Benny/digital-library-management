
const Borrow = require("../models/Borrow");
const Book = require("../models/Book");

// Borrow Book
exports.borrowBook = async (req, res, next) => {
  try {
    const { bookId, dueDate } = req.body;
    if (new Date(dueDate) <= new Date()) {
  return res.status(400).json({
    message: "Due date must be in the future"
    });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    if (book.availableQuantity <= 0) {
      return res.status(400).json({
        message: "Book is not available"
      });
    }

    const existingBorrow = await Borrow.findOne({
      userId: req.user.userId,
      bookId,
      status: "borrowed"
    });

    if (existingBorrow) {
      return res.status(400).json({
        message: "You already borrowed this book"
      });
    }

    const borrow = await Borrow.create({
      userId: req.user.userId,
      bookId,
      dueDate
    });

    book.availableQuantity--;
    await book.save();

    res.status(201).json({
      message: "Book borrowed successfully",
      borrow
    });
  } catch (error) {
    next(error);
  }
};

// Return Book
exports.returnBook = async (req, res, next) => {
  try {
    const borrow = await Borrow.findOne({
      _id: req.params.id,
      userId: req.user.userId,
      status: "borrowed"
    });

    if (!borrow) {
      return res.status(404).json({
        message: "Borrow record not found"
      });
    }

    borrow.status = "returned";
    borrow.returnDate = new Date();

    await borrow.save();

    const book = await Book.findById(borrow.bookId);

    if (book) {
      book.availableQuantity++;
      await book.save();
    }

    res.json({
      message: "Book returned successfully",
      borrow
    });
  } catch (error) {
    next(error);
  }
};

// My Borrowed Books
exports.myBorrows = async (req, res, next) => {
  try {
    const borrows = await Borrow.find({
      userId: req.user.userId
    }).populate("bookId", "title author category");

    res.json({
      count: borrows.length,
      borrows
    });
  } catch (error) {
    next(error);
  }
};

// Get All Borrow Records
exports.getAllBorrows = async (req, res, next) => {
  try {
    const borrows = await Borrow.find()
      .populate("userId", "name email")
      .populate("bookId", "title author");

    res.json({
      count: borrows.length,
      borrows
    });
  } catch (error) {
    next(error);
  }
};

