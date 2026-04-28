const express   = require('express');
const router    = express.Router();
const { body, validationResult } = require('express-validator');
const Task      = require('../models/Task');
const Volunteer = require('../models/Volunteer');

const STATUS_CYCLE = ['pending', 'active', 'completed'];

// ── GET /api/tasks ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await Task.find(filter)
      .populate('assignedVolunteers', 'name skills availability');
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/tasks ────────────────────────────────────────────────────────
router.post('/',
  [
    body('title')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Title must be at least 5 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 200 }).withMessage('Description must be at most 200 characters'),
    body('priority')
      .isIn(['critical', 'high', 'medium'])
      .withMessage('Priority must be critical, high, or medium')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const task  = new Task(req.body);
      const saved = await task.save();
      res.status(201).json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ── PATCH /api/tasks/:id/status ────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const idx = STATUS_CYCLE.indexOf(task.status);
    if (idx === STATUS_CYCLE.length - 1) {
      return res.status(400).json({ error: 'Task is already completed — cannot advance further' });
    }

    task.status = STATUS_CYCLE[idx + 1];
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/tasks/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/tasks/:id/assign ─────────────────────────────────────────────
router.post('/:id/assign',
  [
    body('volunteerId').notEmpty().withMessage('volunteerId is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ error: 'Task not found' });

      const volunteer = await Volunteer.findById(req.body.volunteerId);
      if (!volunteer) return res.status(404).json({ error: 'Volunteer not found' });

      if (volunteer.availability !== 'available') {
        return res.status(400).json({ error: 'Volunteer is not available' });
      }

      const alreadyAssigned = task.assignedVolunteers
        .some(id => id.toString() === volunteer._id.toString());
      if (alreadyAssigned) {
        return res.status(400).json({ error: 'Volunteer is already assigned to this task' });
      }

      task.assignedVolunteers.push(volunteer._id);
      volunteer.assignedTasks.push(task._id);
      volunteer.availability = 'on_task';

      await Promise.all([task.save(), volunteer.save()]);

      const populated = await task.populate('assignedVolunteers', 'name skills availability');
      res.json({ task: populated, volunteer });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
