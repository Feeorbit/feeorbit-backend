const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');

async function updateAnnouncements() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db');
  const res = await Announcement.updateMany(
    { title: { $regex: 'Kal Gym Band', $options: 'i' } },
    {
      title: '⚠️ Gym Closed Tomorrow (Facility Maintenance & Deep Clean)',
      message: 'Dear members, please note that the gym will remain closed tomorrow for monthly sanitation and machine maintenance. Regular training workouts resume the next morning. Stay fit! 💪'
    }
  );
  console.log('Successfully updated announcements to English. Count:', res.modifiedCount);
  process.exit(0);
}

updateAnnouncements().catch((err) => {
  console.error(err);
  process.exit(1);
});
