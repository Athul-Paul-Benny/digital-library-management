const Notification =
  require("../models/Notification");

exports.getNotifications = async (
  req,
  res,
  next
) => {
  try {
    const notifications =
      await Notification.find({
        memberId: req.user.userId
      })
        .populate(
          "transactionId",
          "bookId dueDate fine status"
        )
        .sort({
          createdAt: -1
        });

    res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (
  req,
  res,
  next
) => {
  try {
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          memberId: req.user.userId
        },
        {
          status: "read"
        },
        {
          new: true
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    next(error);
  }
};