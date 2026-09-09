const mongoose = require("mongoose");
const Book = require("../models/Book");

exports.addBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book
    });
  } catch (error) {
    next(error);
  }
};

exports.getBooks = async (req, res, next) => {
  try {
    const books = await Book.find();

    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    const book = await Book.findById(
      req.params.id
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      data: book
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(
      req.params.id
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.json({
      success: true,
      message: "Book deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

exports.searchBooks = async (req, res, next) => {
  try {
    const {
      title,
      author,
      category,
      available
    } = req.query;

    const query = {};

    if (title) {
      query.title = {
        $regex: title,
        $options: "i"
      };
    }

    if (author) {
      query.author = {
        $regex: author,
        $options: "i"
      };
    }

    if (category) {
      query.category = {
        $regex: category,
        $options: "i"
      };
    }

    if (available === "true") {
      query.availableCopies = {
        $gt: 0
      };
    }

    const books = await Book.find(query);

    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (error) {
    next(error);
  }
};

exports.updateInventory = async (req, res, next) => {
  try {
    const {
      totalCopies,
      lostCopies,
      damagedCopies
    } = req.body;

    const book = await Book.findById(
      req.params.id
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    if (totalCopies !== undefined) {
      book.totalCopies = totalCopies;
    }

    if (lostCopies !== undefined) {
      book.lostCopies = lostCopies;
    }

    if (damagedCopies !== undefined) {
      book.damagedCopies = damagedCopies;
    }

    const unavailable =
      book.lostCopies +
      book.damagedCopies;

    book.availableCopies = Math.max(
      0,
      book.totalCopies - unavailable
    );

    await book.save();

    res.json({
      success: true,
      message: "Inventory updated successfully",
      data: book
    });
  } catch (error) {
    next(error);
  }
};