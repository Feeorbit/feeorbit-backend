const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Gym = require('../models/Gym');
const SaasPlan = require('../models/SaasPlan');

async function migrate() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db';
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Seed / Update Super Admin
    const superAdminEmail = 'superadmin@feeorbit.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('SuperAdmin@2026', salt);
      superAdmin = await User.create({
        name: 'Super Admin (FeeOrbit)',
        email: superAdminEmail,
        password: hashedPassword,
        role: 'superadmin',
        isEmailVerified: true,
        isActive: true,
      });
      console.log('Created Super Admin:', superAdmin.email);
    } else {
      superAdmin.role = 'superadmin';
      superAdmin.isActive = true;
      superAdmin.isEmailVerified = true;
      await superAdmin.save();
      console.log('Updated existing user to Super Admin:', superAdmin.email);
    }

    // 2. Link existing Gym Admins to their Gyms
    const rahulUser = await User.findOne({ email: 'rahulyo954030@gmail.com' });
    const aryanUser = await User.findOne({ email: 'aryan@testfitness.com' });

    const rahulGym = await Gym.findById('6aa6b8fb95ccc3f04c4aa883');
    if (rahulGym && rahulUser) {
      rahulGym.owner = rahulUser._id;
      rahulGym.isBranch = false;
      rahulGym.branchName = 'Main HQ Branch';
      rahulGym.branchCode = 'HQ';
      await rahulGym.save();
      console.log('Linked Rahul Gym to owner:', rahulUser.email);
    }

    const aryanGym = await Gym.findById('6aa6ba52f56eb22a50bcf59e');
    if (aryanGym && aryanUser) {
      aryanGym.owner = aryanUser._id;
      aryanGym.isBranch = false;
      aryanGym.branchName = 'Main Facility';
      aryanGym.branchCode = 'HQ';
      await aryanGym.save();
      console.log('Linked Aryan Gym to owner:', aryanUser.email);
    }

    // 3. Seed SaaS Plans
    const plans = [
      {
        name: 'FeeOrbit Starter',
        code: 'starter',
        badge: 'Single Branch',
        monthlyPrice: 999,
        annualPrice: 9990,
        trialDays: 14,
        description: 'Perfect for boutique studios & single-location fitness clubs.',
        maxMembers: 150,
        maxBranches: 1,
        features: [
          'Up to 150 Active Members',
          'Instant Check-in Kiosk & QR Pass',
          'Member Directory & Excel Export',
          'Automated Fee Dues Tracking',
          'Standard Digital Receipts',
          'Single Branch Location',
        ],
        popular: false,
        isActive: true,
      },
      {
        name: 'FeeOrbit Pro',
        code: 'pro',
        badge: 'Most Popular',
        monthlyPrice: 1999,
        annualPrice: 19990,
        trialDays: 14,
        description: 'Comprehensive ERP operating system for growing gyms and multi-branch fitness centers.',
        maxMembers: 500,
        maxBranches: 3,
        features: [
          'Up to 500 Active Members',
          'Up to 3 Branch Locations',
          'Staff Management & Trainer Payroll',
          'Equipment Health & Service Alerts',
          'Real-time P&L Statement & Expenses',
          'WhatsApp Payment Alerts & Receipts',
          'Brevo Transactional Emails',
          'Multi-Color White-Label Themes',
        ],
        popular: true,
        isActive: true,
      },
      {
        name: 'FeeOrbit Enterprise',
        code: 'enterprise',
        badge: 'Gym Chains',
        monthlyPrice: 4999,
        annualPrice: 49990,
        trialDays: 14,
        description: 'Unlimited capacity & multi-branch franchise chain operations.',
        maxMembers: 99999,
        maxBranches: 99,
        features: [
          'Unlimited Gym Members',
          'Unlimited Branch Locations',
          'All Pro Features Included',
          'Custom White-Label Domain & CMS',
          'Dedicated Cloud Server & DB Backup',
          'Custom ERP API Integrations',
          '24/7 Priority Phone Support',
          'On-site Staff Training Webinar',
        ],
        popular: false,
        isActive: true,
      },
    ];

    for (const p of plans) {
      await SaasPlan.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true });
    }
    console.log('Seeded SaaS subscription plans successfully.');

    console.log('MIGRATION COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
