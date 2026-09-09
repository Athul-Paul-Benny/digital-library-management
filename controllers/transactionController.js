const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const Book = require("../models/Book");
const User = require("../models/User");
const MembershipPlan = require("../models/MembershipPlan");
const Hold = require("../models/Hold");
const Notification = require("../models/Notification");

const FINE_PER_DAY = 10;

exports.issueBook = async (req, res, next) => {
  try {
    const {
      bookId,
      memberId
    } = req.body;

    const targetMemberId =
      memberId || req.user.userId;

    if (
      !mongoose.Types.ObjectId.isValid(bookId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        targetMemberId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID"
      });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(409).json({
        success: false,
        message: "Book is currently unavailable",
        errorCode: "OUT_OF_STOCK"
      });
    }

    const member = await User.findById(
      targetMemberId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    const plan = await MembershipPlan.findOne({
      type: member.memberType
    });

    const maxBooks = plan
      ? plan.maxBooks
      : member.memberType === "faculty"
        ? 5
        : 3;

    const loanDays = plan
      ? plan.loanDays
      : member.memberType === "faculty"
        ? 30
        : 14;

    const activeCount =
      await Transaction.countDocuments({
        memberId: targetMemberId,
        status: "issued"
      });

    if (activeCount >= maxBooks) {
      return res.status(409).json({
        success: false,
        message:
          "Membership borrowing limit reached",
        errorCode: "BORROW_LIMIT"
      });
    }

    const alreadyBorrowed =
      await Transaction.findOne({
        memberId: targetMemberId,
        bookId,
        status: "issued"
      });

    if (alreadyBorrowed) {
      return res.status(409).json({
        success: false,
        message: "Member already has this book"
      });
    }

    const issueDate = new Date();

    const dueDate = new Date(issueDate);
    dueDate.setDate(
      dueDate.getDate() + loanDays
    );

    const transaction =
      await Transaction.create({
        bookId,
        memberId: targetMemberId,
        issueDate,
        dueDate
      });

    book.availableCopies--;
    await book.save();

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: {
        transaction,
        dueDate,
        loanDays
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.returnBook = async (req, res, next) => {
  try {
    const transaction =
      await Transaction.findById(
        req.params.id
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    if (transaction.status === "returned") {
      return res.status(409).json({
        success: false,
        message: "Book already returned"
      });
    }

    if (
      req.user.role === "member" &&
      transaction.memberId.toString() !==
        req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only return your own book"
      });
    }

    const returnDate = new Date();

    let fine = 0;

    if (returnDate > transaction.dueDate) {
      const milliseconds =
        returnDate - transaction.dueDate;

      const daysLate = Math.ceil(
        milliseconds /
          (1000 * 60 * 60 * 24)
      );

      fine = daysLate * FINE_PER_DAY;
    }

    transaction.returnDate = returnDate;
    transaction.fine = fine;
    transaction.status = "returned";

    await transaction.save();

    const book = await Book.findById(
      transaction.bookId
    );

    if (book) {
      book.availableCopies++;
      await book.save();
    }

    if (fine > 0) {
      await Notification.create({
        memberId: transaction.memberId,
        transactionId: transaction._id,
        message:
          `Book returned late. Fine due: ₹${fine}`,
        type: "overdue"
      });
    }

    res.json({
      success: true,
      message: "Book returned successfully",
      data: {
        transaction,
        fine,
        finePerDay: FINE_PER_DAY
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyTransactions = async (
  req,
  res,
  next
) => {
  try {
    const transactions =
      await Transaction.find({
        memberId: req.user.userId
      })
        .populate(
          "bookId",
          "title author isbn category"
        )
        .sort({
          issueDate: -1
        });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTransactions = async (
  req,
  res,
  next
) => {
  try {
    const transactions =
      await Transaction.find()
        .populate(
          "bookId",
          "title author isbn"
        )
        .populate(
          "memberId",
          "name email membershipId"
        )
        .sort({
          issueDate: -1
        });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOverdueTransactions = async (
  req,
  res,
  next
) => {
  try {
    const now = new Date();

    const overdue =
      await Transaction.find({
        status: "issued",
        dueDate: {
          $lt: now
        }
      });

    for (const transaction of overdue) {
      transaction.status = "overdue";
      await transaction.save();

      const existing =
        await Notification.findOne({
          transactionId: transaction._id,
          type: "overdue"
        });

      if (!existing) {
        await Notification.create({
          memberId: transaction.memberId,
          transactionId: transaction._id,
          message:
            "Your borrowed book is overdue.",
          type: "overdue"
        });
      }
    }

    res.json({
      success: true,
      message:
        "Overdue records updated successfully",
      count: overdue.length
    });
  } catch (error) {
    next(error);
  }
};