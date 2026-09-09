const Transaction =
  require("../models/Transaction");

const Book =
  require("../models/Book");

exports.overdueReport = async (
  req,
  res,
  next
) => {
  try {
    const overdue =
      await Transaction.find({
        status: "overdue"
      })
        .populate(
          "memberId",
          "name email membershipId"
        )
        .populate(
          "bookId",
          "title author"
        )
        .sort({
          dueDate: 1
        });

    res.json({
      success: true,
      count: overdue.length,
      data: overdue
    });
  } catch (error) {
    next(error);
  }
};

exports.mostBorrowed = async (
  req,
  res,
  next
) => {
  try {
    const report =
      await Transaction.aggregate([
        {
          $group: {
            _id: "$bookId",
            borrowCount: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            borrowCount: -1
          }
        },
        {
          $limit: 10
        }
      ]);

    const result = [];

    for (const item of report) {
      const book =
        await Book.findById(item._id);

      result.push({
        book,
        borrowCount:
          item.borrowCount
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

exports.inventoryReport = async (
  req,
  res,
  next
) => {
  try {
    const books =
      await Book.find();

    const totalTitles =
      books.length;

    const totalCopies =
      books.reduce(
        (sum, book) =>
          sum + book.totalCopies,
        0
      );

    const availableCopies =
      books.reduce(
        (sum, book) =>
          sum + book.availableCopies,
        0
      );

    const lostCopies =
      books.reduce(
        (sum, book) =>
          sum + book.lostCopies,
        0
      );

    const damagedCopies =
      books.reduce(
        (sum, book) =>
          sum + book.damagedCopies,
        0
      );

    res.json({
      success: true,
      data: {
        totalTitles,
        totalCopies,
        availableCopies,
        lostCopies,
        damagedCopies
      }
    });
  } catch (error) {
    next(error);
  }
};