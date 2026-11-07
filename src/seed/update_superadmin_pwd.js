const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db');
const User = require('../models/User');
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password@123', salt);
  
  let superAdmin = await User.findOne({ email: 'superadmin@feeorbit.com' });
  if (!superAdmin) {
    superAdmin = new User({
      name: 'Super Admin (FeeOrbit Cloud)',
      email: 'superadmin@feeorbit.com',
      password: 'Password@123',
      role: 'superadmin',
      isActive: true,
      isEmailVerified: true
    });
    await superAdmin.save();
    console.log('Created new superadmin user');
  } else {
    // Note: User.pre('save') will hash this plain text Password@123
    superAdmin.password = 'Password@123';
    superAdmin.role = 'superadmin';
    superAdmin.isActive = true;
    superAdmin.isEmailVerified = true;
    await superAdmin.save();
    console.log('Successfully updated superadmin user password to plain Password@123 (hashed by pre-save hook)');
  }

  // Verify
  const isMatch123 = await bcrypt.compare('Password@123', superAdmin.password);
  console.log('Verified Password@123 matches:', isMatch123);
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
