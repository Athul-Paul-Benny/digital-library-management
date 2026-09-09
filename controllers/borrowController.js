const Borrow = require("../models/Borrow");
const Book = require("../models/Book");

const borrowBook = async (req, res, next) => {
  try {
    const { bookId, dueDate } = req.body;

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: "No copies available",
      });
    }

    const borrow = await Borrow.create({
      user: req.user.userId,
      book: bookId,
      dueDate,
    });

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

const returnBook = async (req, res, next) => {
  try {
    const borrow = await Borrow.findById(req.params.id);

    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: "Borrow record not found",
      });
    }

    if (borrow.returnDate) {
      return res.status(400).json({
        success: false,
        message: "Book already returned",
      });
    }

    borrow.returnDate = new Date();
    await borrow.save();

    const book = await Book.findById(borrow.book);

    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    res.json({
      success: true,
      message: "Book returned successfully",
      data: borrow,
    });
  } catch (error) {
    next(error);
  }
};

const getMyBorrows = async (req, res, next) => {
  try {
    const borrows = await Borrow.find({
      user: req.user.userId,
    })
      .populate("book")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    next(error);
  }
};

const getAllBorrows = async (req, res, next) => {
  try {
    const borrows = await Borrow.find()
      .populate("user", "name email role")
      .populate("book", "title author isbn category")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: borrows.length,
      data: borrows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  borrowBook,
  returnBook,
  getMyBorrows,
  getAllBorrows,
};