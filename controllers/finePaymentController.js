const Transaction = require("../models/Transaction");
const FinePayment = require("../models/FinePayment");

exports.payFine = async (
  req,
  res,
  next
) => {
  try {
    const {
      transactionId,
      amount
    } = req.body;

    const transaction =
      await Transaction.findById(
        transactionId
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    if (
      req.user.role === "member" &&
      transaction.memberId.toString() !==
        req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only pay your own fine"
      });
    }

    if (transaction.fine <= 0) {
      return res.status(409).json({
        success: false,
        message: "No fine is pending"
      });
    }

    if (amount !== transaction.fine) {
      return res.status(400).json({
        success: false,
        message:
          `Payment amount must be ₹${transaction.fine}`
      });
    }

    const payment =
      await FinePayment.create({
        transactionId,
        memberId: transaction.memberId,
        amount,
        status: "paid"
      });

    transaction.finePaid = true;

    await transaction.save();

    res.status(201).json({
      success: true,
      message: "Fine payment recorded",
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

exports.getPayments = async (
  req,
  res,
  next
) => {
  try {
    const query =
      req.user.role === "member"
        ? {
            memberId: req.user.userId
          }
        : {};

    const payments =
      await FinePayment.find(query)
        .populate(
          "transactionId",
          "bookId fine status"
        )
        .sort({
          paidAt: -1
        });

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    next(error);
  }
};