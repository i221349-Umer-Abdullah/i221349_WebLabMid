const Task      = require('./models/Task');
const Volunteer = require('./models/Volunteer');

async function getStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Single aggregation pipeline on Task collection using $facet
  const [result] = await Task.aggregate([
    {
      $facet: {
        totalActive: [
          { $match: { status: 'active' } },
          { $count: 'count' }
        ],
        totalCritical: [
          { $match: { priority: 'critical' } },
          { $count: 'count' }
        ],
        completedToday: [
          { $match: { status: 'completed', createdAt: { $gte: todayStart } } },
          { $count: 'count' }
        ]
      }
    },
    {
      $project: {
        totalActive:    { $ifNull: [{ $arrayElemAt: ['$totalActive.count',    0] }, 0] },
        totalCritical:  { $ifNull: [{ $arrayElemAt: ['$totalCritical.count',  0] }, 0] },
        completedToday: { $ifNull: [{ $arrayElemAt: ['$completedToday.count', 0] }, 0] }
      }
    }
  ]);

  // Volunteer count fetched separately (Mongoose does not support cross-collection $lookup counts cleanly)
  const totalVolunteers = await Volunteer.countDocuments();

  return { ...result, totalVolunteers };
}

module.exports = getStats;
