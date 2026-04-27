const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false },
  order: { type: Number, default: 0 },
});

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["single", "multiple", "text"],
    required: true,
  },
  points: { type: Number, default: 1 },
  order: { type: Number, default: 0 },
  explanation: { type: String, default: "" },
  answers: [answerSchema],
});

const testSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    passingScore: { type: Number, required: true, min: 0, max: 100 },
    questions: [questionSchema],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

module.exports = mongoose.model("Test", testSchema);
