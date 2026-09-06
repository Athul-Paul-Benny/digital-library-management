const mongoose = require("mongoose");
const Book = require("../models/Book");

// Add Book
exports.addBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);

    res.status(201).json({
      message: "Book added successfully",
      book
    });
  } catch (error) {
    next(error);
  }
};

// Get All Books
exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find();

    res.json({
      count: books.length,
      books
    });
  } catch (error) {
    next(error);
  }
};

// Get Book By ID
exports.getBook = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({
    message: "Invalid book ID"
    });
    } 
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.json({ book });
  } catch (error) {
    next(error);
  }
};

// Update Book
exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.json({
      message: "Book updated successfully",
      book
    });
  } catch (error) {
    next(error);
  }
};

// Delete Book
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found"
      });
    }

    res.json({
      message: "Book deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Search Books
exports.searchBooks = async (req, res, next) => {
  try {
    const { title, author, category } = req.query;

    const query = {};

    if (title) query.title = { $regex: title, $options: "i" };
    if (author) query.author = { $regex: author, $options: "i" };
    if (category) query.category = { $regex: category, $options: "i" };

    const books = await Book.find(query);

    res.json({
      count: books.length,
      books
    });
  } catch (error) {
    next(error);
  }
};

