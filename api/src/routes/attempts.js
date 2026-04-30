/**
 * @swagger
 * tags:
 *   name: Attempts
 */

const express = require("express");
const router = express.Router();
const TestAttempt = require("../models/TestAttempt");
const Test = require("../models/Test");
const { protect } = require("../middleware/auth");

/**
 * @swagger
 * /api/attempts:
 *   get:
 *     tags: [Attempts]
 *     parameters:
 *       - in: query
 *         name: testId
 *         schema:
 *           type: string
 *         description: Filter by test
 *     responses:
 *       200:
 *         description: Array of attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestAttempt'
 */
router.get("/", protect, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { userId: req.user._id };
    if (req.query.testId) filter.testId = req.query.testId;

    const attempts = await TestAttempt.find(filter)
      .populate("testId", "title passingScore")
      .populate("userId", "firstName lastName email")
      .sort({ startedAt: -1 });

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/attempts/{id}:
 *   get:
 *     tags: [Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestAttempt'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attempt not found
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id)
      .populate("testId")
      .populate("userId", "firstName lastName email");

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });

    const isOwnerOrAdmin =
      req.user.role === "admin" ||
      attempt.userId._id.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return res.status(403).json({ message: "Forbidden" });

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/attempts/start:
 *   post:
 *     tags: [Attempts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testId]
 *             properties:
 *               testId:
 *                 type: string
 *                 example: 664a1f2e8b1c2d3e4f5a6b7c
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attempt:
 *                   $ref: '#/components/schemas/TestAttempt'
 *                 test:
 *                   $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found
 */
router.post("/start", protect, async (req, res) => {
  try {
    const { testId } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: "Test not found" });

    const attemptCount = await TestAttempt.countDocuments({
      userId: req.user._id,
      testId,
    });
    const maxScore = test.questions.reduce((sum, q) => sum + q.points, 0);

    const attempt = await TestAttempt.create({
      userId: req.user._id,
      testId,
      attemptNumber: attemptCount + 1,
      maxScore,
      status: "in-progress",
    });

    const testData = test.toObject();
    testData.questions = testData.questions.map((q) => ({
      ...q,
      answers: q.answers.map(({ isCorrect, ...rest }) => rest),
    }));

    res.status(201).json({ attempt, test: testData });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/attempts/{id}/answer:
 *   post:
 *     tags: [Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId]
 *             properties:
 *               questionId:
 *                 type: string
 *               selectedAnswerId:
 *                 type: string
 *                 description: For single/multiple choice questions
 *               textAnswer:
 *                 type: string
 *                 description: For text questions
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCorrect:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Attempt already finished
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attempt or question not found
 */
router.post("/:id/answer", protect, async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (attempt.status !== "in-progress")
      return res.status(400).json({ message: "Attempt is already finished" });

    const test = await Test.findById(attempt.testId);
    const { questionId, selectedAnswerId, textAnswer } = req.body;

    const question = test.questions.id(questionId);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    let isCorrect = false;
    if (question.questionType !== "text") {
      const answer = question.answers.id(selectedAnswerId);
      isCorrect = answer?.isCorrect ?? false;
    }

    attempt.userAnswers = attempt.userAnswers.filter(
      (a) => a.questionId.toString() !== questionId,
    );
    attempt.userAnswers.push({
      questionId,
      selectedAnswerId: selectedAnswerId || null,
      textAnswer: textAnswer || "",
      isCorrect,
      answeredAt: new Date(),
    });

    await attempt.save();
    res.json({ isCorrect, message: "Answer recorded" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/attempts/{id}/finish:
 *   post:
 *     tags: [Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinishResult'
 *       400:
 *         description: Attempt already finished
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attempt not found
 */
router.post("/:id/finish", protect, async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (attempt.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (attempt.status !== "in-progress")
      return res.status(400).json({ message: "Attempt already finished" });

    const test = await Test.findById(attempt.testId);
    let score = 0;
    for (const ua of attempt.userAnswers) {
      if (ua.isCorrect) {
        const question = test.questions.id(ua.questionId);
        score += question?.points ?? 1;
      }
    }

    attempt.score = score;
    attempt.finishedAt = new Date();
    attempt.status = "completed";
    await attempt.save();

    const percentage =
      attempt.maxScore > 0 ? (score / attempt.maxScore) * 100 : 0;
    const passed = percentage >= test.passingScore;

    res.json({
      attempt,
      score,
      maxScore: attempt.maxScore,
      percentage: Math.round(percentage),
      passed,
      passingScore: test.passingScore,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/attempts/{id}:
 *   delete:
 *     tags: [Attempts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attempt deleted
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Attempt not found
 */
router.delete("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });
    const attempt = await TestAttempt.findByIdAndDelete(req.params.id);
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    res.json({ message: "Attempt deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
