/**
 * @swagger
 * tags:
 *   name: Geo
 *   description: Geospatial — user locations and nearby search
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

/**
 * @swagger
 * /api/geo/me/location:
 *   put:
 *     tags: [Geo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lng, lat]
 *             properties:
 *               lng:     { type: number, example: 30.5234 }
 *               lat:     { type: number, example: 50.4501 }
 *               city:    { type: string, example: "Kyiv" }
 *               country: { type: string, example: "Ukraine" }
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put("/me/location", protect, async (req, res) => {
  try {
    const { lng, lat, city, country } = req.body;
    if (lng === undefined || lat === undefined) {
      return res.status(400).json({ message: "lng and lat are required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          "location.type": "Point",
          "location.coordinates": [Number(lng), Number(lat)],
          "location.city": city || null,
          "location.country": country || null,
        },
      },
      { new: true },
    );

    res.json({ message: "Location updated", location: user.location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/geo/me/location:
 *   delete:
 *     tags: [Geo]
 *     responses:
 *       200:
 *         description: Location cleared
 */
router.delete("/me/location", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { location: "" },
    });
    res.json({ message: "Location removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/geo/users:
 *   get:
 *     tags: [Geo]
 *     responses:
 *       200:
 *         description: Array of users with coordinates
 */
router.get("/users", protect, async (req, res) => {
  try {
    const users = await User.find(
      {
        location: { $exists: true },
        "location.coordinates": { $exists: true },
      },
      { passwordHash: 0, isDeleted: 0, deletedAt: 0 },
    );
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @swagger
 * /api/geo/users/nearby:
 *   get:
 *     tags: [Geo]
 *     parameters:
 *       - { in: query, name: lng,    required: true,  schema: { type: number } }
 *       - { in: query, name: lat,    required: true,  schema: { type: number } }
 *       - { in: query, name: radius, schema: { type: number, default: 50000 }, description: "Metres" }
 *     responses:
 *       200:
 *         description: Users sorted by distance
 */
router.get("/users/nearby", protect, async (req, res) => {
  try {
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    const radius = Number(req.query.radius) || 50000;

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ message: "lng and lat are required" });
    }

    const users = await User.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distance",
          maxDistance: radius,
          spherical: true,
          query: {
            isDeleted: false,
            "location.coordinates": { $exists: true },
          },
        },
      },
      { $project: { passwordHash: 0, isDeleted: 0, deletedAt: 0 } },
    ]);

    res.json({ count: users.length, radius, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
