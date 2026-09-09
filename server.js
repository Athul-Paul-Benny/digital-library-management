require("dotenv").config();

const express = require("express");

const connectDB =
  require("./config/database");

const errorHandler =
  require("./middleware/errorHandler");

const authRoutes =
  require("./routes/authRoutes");

const bookRoutes =
  require("./routes/bookRoutes");

const transactionRoutes =
  require("./routes/transactionRoutes");

const holdRoutes =
  require("./routes/holdRoutes");

const finePaymentRoutes =
  require("./routes/finePaymentRoutes");

const notificationRoutes =
  require("./routes/notificationRoutes");

const memberRoutes =
  require("./routes/memberRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

const app = express();

connectDB();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Digital Library Management System API"
  });
});

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/books",
  bookRoutes
);

app.use(
  "/api/transactions",
  transactionRoutes
);

app.use(
  "/api/holds",
  holdRoutes
);

app.use(
  "/api/fine-payments",
  finePaymentRoutes
);

app.use(
  "/api/notifications",
  notificationRoutes
);

app.use(
  "/api/members",
  memberRoutes
);

app.use(
  "/api/admin/reports",
  reportRoutes
);

app.use(errorHandler);

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});