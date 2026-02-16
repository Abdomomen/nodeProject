const express = require("express");
const cors = require("cors");
const app = express();
const userRouter = require("./routes/user.route");
const postRouter = require("./routes/post.route");
const commentRouter = require("./routes/comment.route");
const { errorHandler } = require("./middlewares/errors");
// connect to database
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.log("Error connecting to MongoDB:", err);
  }
};

app.use(express.json());
app.use(cors());
app.use("/api/users", userRouter);
app.use("/api/posts", postRouter);
app.use("/api/comments", commentRouter);

app.use(errorHandler);
if (require.main === module) {
  connectDB().then(() => {
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  });
}

module.exports = app;
