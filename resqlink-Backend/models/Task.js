const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:              { type: String, required: true, minlength: 5 },
  description:        { type: String, required: true, maxlength: 200 },
  priority:           { type: String, enum: ['critical', 'high', 'medium'], required: true },
  status:             { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  minVolunteers:      { type: Number, min: 1, default: 1 },
  requiredSkills:     [String],
  assignedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' }],
  createdAt:          { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
