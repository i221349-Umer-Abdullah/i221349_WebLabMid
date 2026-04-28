const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  skills:         [String],
  availability:   { type: String, enum: ['available', 'on_task'], default: 'available' },
  assignedTasks:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
});

module.exports = mongoose.model('Volunteer', volunteerSchema);
