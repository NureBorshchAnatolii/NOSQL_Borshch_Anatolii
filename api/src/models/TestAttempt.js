const mongoose = require("mongoose");

const userAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedAnswerId: { type: mongoose.Schema.Types.ObjectId, default: null },
  textAnswer: { type: String, default: "" },
  isCorrect: { type: Boolean, default: false },
  answeredAt: { type: Date, default: Date.now },
});

const testAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ["in-progress", "completed", "abandoned"],
    default: "in-progress",
  },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  attemptNumber: { type: Number, default: 1 },
  userAnswers: [userAnswerSchema],
});

module.exports = mongoose.model("TestAttempt", testAttemptSchema);
