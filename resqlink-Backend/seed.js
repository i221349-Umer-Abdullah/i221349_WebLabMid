require('dotenv').config();
const mongoose  = require('mongoose');
const Task      = require('./models/Task');
const Volunteer = require('./models/Volunteer');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // 1. Clear both collections before inserting fresh data
  await Task.deleteMany({});
  await Volunteer.deleteMany({});

  // 2. Insert volunteers first to obtain their _id values
  const [ahmad, sara, bilal] = await Volunteer.insertMany([
    {
      name: 'Ahmad K.',
      email: 'ahmad@relief.org',
      skills: ['First Aid', 'Logistics'],
      availability: 'available'
    },
    {
      name: 'Sara M.',
      email: 'sara@relief.org',
      skills: ['Medical', 'Search & Rescue'],
      availability: 'on_task'   // assigned to Shelter Infrastructure
    },
    {
      name: 'Bilal R.',
      email: 'bilal@relief.org',
      skills: ['Engineering', 'Logistics'],
      availability: 'available'
    }
  ]);

  // 3. Insert the 3 seed tasks
  const task1 = await Task.create({
    title:              'Medical Supply Distribution',
    description:        'Coordinate delivery of medical kits to Zone A shelters. Minimum 3 volunteers required.',
    priority:           'critical',
    status:             'pending',
    minVolunteers:      3,
    requiredSkills:     ['First Aid', 'Logistics'],
    assignedVolunteers: []
  });

  // Task 2 already has 3 assigned volunteers
  const task2 = await Task.create({
    title:              'Shelter Infrastructure Zone B',
    description:        'Set up temporary shelters for 200 displaced families in Zone B. Engineering skills needed.',
    priority:           'high',
    status:             'active',
    minVolunteers:      4,
    requiredSkills:     ['Engineering', 'Logistics'],
    assignedVolunteers: [ahmad._id, sara._id, bilal._id]
  });

  const task3 = await Task.create({
    title:              'Water Purification Unit Ops',
    description:        'Operate purification stations at locations W1, W2, W3. Daily volunteer rotation schedule.',
    priority:           'medium',
    status:             'completed',
    minVolunteers:      2,
    requiredSkills:     ['Medical', 'Engineering'],
    assignedVolunteers: []
  });

  // 4. Back-fill assignedTasks on the three volunteers for task2
  await Volunteer.findByIdAndUpdate(ahmad._id, { $push: { assignedTasks: task2._id } });
  await Volunteer.findByIdAndUpdate(sara._id,  { $push: { assignedTasks: task2._id } });
  await Volunteer.findByIdAndUpdate(bilal._id, { $push: { assignedTasks: task2._id } });

  // 5. Done
  console.log('Seeded successfully');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
