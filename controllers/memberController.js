const MembershipPlan =
  require("../models/MembershipPlan");

const Transaction =
  require("../models/Transaction");

exports.createPlan = async (
  req,
  res,
  next
) => {
  try {
    const plan =
      await MembershipPlan.findOneAndUpdate(
        {
          type: req.body.type
        },
        {
          type: req.body.type,
          maxBooks: req.body.maxBooks,
          loanDays: req.body.loanDays
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

    res.status(201).json({
      success: true,
      message: "Membership plan saved",
      data: plan
    });
  } catch (error) {
    next(error);
  }
};

exports.getPlans = async (
  req,
  res,
  next
) => {
  try {
    const plans =
      await MembershipPlan.find();

    res.json({
      success: true,
      count: plans.length,
      data: plans
    });
  } catch (error) {
    next(error);
  }
};

exports.getMemberHistory = async (
  req,
  res,
  next
) => {
  try {
    const transactions =
      await Transaction.find({
        memberId: req.params.id
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