/**
 * @swagger
 * tags:
 *   name: Tests
 */

const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/tests:
 *   get:
 *     tags: [Tests]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by creator
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Test'
 */
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.userId)     filter.userId = req.query.userId;

    const tests = await Test.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('categoryId', 'name')
      .select('-questions.answers.isCorrect')
      .sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     tags: [Tests]
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
 *               $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('categoryId', 'name');

    if (!test) return res.status(404).json({ message: 'Test not found' });

    const isAdminOrOwner =
      req.user.role === 'admin' || test.userId._id.toString() === req.user._id.toString();

    if (!isAdminOrOwner) {
      const sanitized = test.toObject();
      sanitized.questions = sanitized.questions.map((q) => ({
        ...q,
        answers: q.answers.map(({ isCorrect, ...rest }) => rest),
      }));
      return res.json(sanitized);
    }

    res.json(test);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests:
 *   post:
 *     tags: [Tests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestBody'
 *     responses:
 *       201:
 *         description: Created test
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       400:
 *         description: Validation error
 */
router.post('/', protect, async (req, res) => {
  try {
    const { categoryId, title, description, passingScore, questions } = req.body;
    const test = await Test.create({
      userId: req.user._id,
      categoryId,
      title,
      description,
      passingScore,
      questions: questions || [],
    });
    res.status(201).json(test);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   put:
 *     tags: [Tests]
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
 *             $ref: '#/components/schemas/TestBody'
 *     responses:
 *       200:
 *         description: Updated test
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Test not found
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const isOwnerOrAdmin =
      req.user.role === 'admin' || test.userId.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return res.status(403).json({ message: 'Forbidden' });

    const { categoryId, title, description, passingScore, questions } = req.body;
    Object.assign(test, { categoryId, title, description, passingScore, questions });
    await test.save();
    res.json(test);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Test deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Test not found
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const isOwnerOrAdmin =
      req.user.role === 'admin' ||
      test.userId.toString() === req.user._id.toString();

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await test.deleteOne();

    res.json({ message: 'Test deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/{id}/questions:
 *   post:
 *     tags: [Tests]
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
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Test not found
 */
router.post('/:id/questions', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const isOwnerOrAdmin =
      req.user.role === 'admin' || test.userId.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return res.status(403).json({ message: 'Forbidden' });

    test.questions.push(req.body);
    await test.save();
    res.status(201).json(test.questions[test.questions.length - 1]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/{id}/questions/{qId}:
 *   put:
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuestionInput'
 *     responses:
 *       200:
 *         description: Updated question
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Test or question not found
 */
router.put('/:id/questions/:qId', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const isOwnerOrAdmin =
      req.user.role === 'admin' || test.userId.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return res.status(403).json({ message: 'Forbidden' });

    const question = test.questions.id(req.params.qId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    Object.assign(question, req.body);
    await test.save();
    res.json(question);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/tests/{id}/questions/{qId}:
 *   delete:
 *     tags: [Tests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: qId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Test not found
 */
router.delete('/:id/questions/:qId', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const isOwnerOrAdmin =
      req.user.role === 'admin' || test.userId.toString() === req.user._id.toString();
    if (!isOwnerOrAdmin) return res.status(403).json({ message: 'Forbidden' });

    test.questions.pull({ _id: req.params.qId });
    await test.save();
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
