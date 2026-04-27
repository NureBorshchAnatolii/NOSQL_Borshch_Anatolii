/**
 * @swagger
 * tags:
 *   name: Queries
 */

const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const User        = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/queries/users-no-attempts:
 *   get:
 *     summary: "1.2.1 — Users who have never made any test attempt"
 *     tags: [Queries]
 *     responses:
 *       200:
 *         description: List of users with zero attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 */
router.get('/users-no-attempts', protect, adminOnly, async (req, res) => {
  try {
    const data = await User.aggregate([
      {
        $lookup: {
          from:         'testattempts',
          localField:   '_id',
          foreignField: 'userId',
          as:           'attempts',
        },
      },
      {
        $match: { attempts: { $size: 0 } },
      },
      {
        $project: { passwordHash: 0, attempts: 0 },
      },
    ]);

    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/users-by-name:
 *   get:
 *     summary: "1.2.2 — Search users by first name or last name"
 *     tags: [Queries]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: "Name fragment to search (e.g. 'john')"
 *     responses:
 *       200:
 *         description: Matching users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 query:  { type: string }
 *                 count:  { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Missing query parameter
 */
router.get('/users-by-name', protect, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).json({ message: 'Query param ?name= is required' });

    const data = await User.find(
      {
        $or: [
          { firstName: { $regex: name, $options: 'i' } },
          { lastName:  { $regex: name, $options: 'i' } },
        ],
      },
      { passwordHash: 0 }
    ).sort({ lastName: 1, firstName: 1 });

    res.json({ query: name, count: data.length, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/attempts-by-score:
 *   get:
 *     summary: "1.2.3 — Latest completed attempts with score >= minScore"
 *     tags: [Queries]
 *     parameters:
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: integer
 *           default: 80
 *         description: Minimum score (absolute points, not percentage)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Attempts sorted by most recent first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 minScore: { type: integer }
 *                 count:    { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/TestAttempt' }
 */
router.get('/attempts-by-score', protect, async (req, res) => {
  try {
    const minScore = Number(req.query.minScore ?? 80);
    const limit    = Number(req.query.limit    ?? 5);

    const data = await TestAttempt.find(
      {
        status: 'completed',
        score:  { $gte: minScore },
      }
    )
      .sort({ finishedAt: -1 })
      .limit(limit)
      .populate('userId', 'firstName lastName email')
      .populate('testId', 'title passingScore');

    res.json({ minScore, count: data.length, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/queries/abandon-attempts:
 *   patch:
 *     summary: "1.2.4 — Abandon all in-progress attempts started before a cutoff date"
 *     tags: [Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cutoffDate]
 *             properties:
 *               cutoffDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-01T00:00:00.000Z"
 *                 description: Attempts started before this date will be abandoned
 *     responses:
 *       200:
 *         description: Update result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cutoffDate:    { type: string }
 *                 matched:       { type: integer }
 *                 abandoned:     { type: integer }
 *       400:
 *         description: Missing or invalid cutoffDate
 */
router.patch('/abandon-attempts', protect, adminOnly, async (req, res) => {
  try {
    const { cutoffDate } = req.body;
    if (!cutoffDate) return res.status(400).json({ message: 'Body field cutoffDate is required' });

    const cutoff = new Date(cutoffDate);
    if (isNaN(cutoff.getTime())) return res.status(400).json({ message: 'cutoffDate is not a valid date' });

    const result = await TestAttempt.updateMany(
      {
        status:    'in-progress',
        startedAt: { $lt: cutoff },
      },
      {
        $set: {
          status:     'abandoned',
          finishedAt: cutoff,
        },
      }
    );

    res.json({
      cutoffDate: cutoff.toISOString(),
      matched:   result.matchedCount,
      abandoned: result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;