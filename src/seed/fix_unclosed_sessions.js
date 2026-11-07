const mongoose = require('mongoose');

async function fixSessions() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db');
  const Attendance = require('../models/Attendance');
  
  const today = new Date().toISOString().split('T')[0];
  const records = await Attendance.find({ date: { $ne: today }, $or: [{ checkOut: null }, { checkOut: { $exists: false } }] });
  
  console.log(`Found ${records.length} unclosed past sessions to finalize.`);
  for (const r of records) {
    r.durationMinutes = r.durationMinutes > 0 ? r.durationMinutes : 45;
    const checkInTime = r.checkIn ? new Date(r.checkIn).getTime() : new Date(r.createdAt).getTime();
    r.checkOut = new Date(checkInTime + 45 * 60 * 1000);
    await r.save();
  }
  
  console.log('Successfully updated unclosed sessions.');
  await mongoose.disconnect();
}

fixSessions().catch(err => {
  console.error(err);
  process.exit(1);
});
