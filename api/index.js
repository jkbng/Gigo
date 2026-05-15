require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

app.use("/api/jobs",   require("./routes/jobs"));
app.use("/api/gigs",   require("./routes/gigs"));
app.use("/api/resume", require("./routes/resume"));

app.get("/health", (req, res) =>
  res.json({ status: "ok", app: "GigoAI", timestamp: new Date().toISOString() })
);

// Reuse MongoDB connection across serverless invocations
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI environment variable is not set");
  await mongoose.connect(uri);
  isConnected = true;
}

// Middleware to ensure DB is connected before every request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Database connection failed: " + err.message });
  }
});

// Local dev only
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 GigoAI running on http://localhost:${PORT}`));
}

module.exports = app;
