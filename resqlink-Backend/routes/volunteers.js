const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const Volunteer = require('../models/Volunteer');

// ── GET /api/volunteers ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const volunteers = await Volunteer.find();
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/volunteers ───────────────────────────────────────────────────
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const volunteer = new Volunteer(req.body);
      const saved     = await volunteer.save();
      res.status(201).json(saved);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
