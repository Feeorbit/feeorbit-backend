require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Gym = require('../models/Gym');
const Staff = require('../models/Staff');
const Equipment = require('../models/Equipment');
const Expense = require('../models/Expense');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB for ERP & CMS seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // Clear existing collections
    await Gym.deleteMany({});
    await Staff.deleteMany({});
    await Equipment.deleteMany({});
    await Expense.deleteMany({});
    await Plan.deleteMany({});
    await Member.deleteMany({});
    await Attendance.deleteMany({});
    await Payment.deleteMany({});
    await User.deleteMany({});
    console.log('Cleaned all existing collections.');

    // 1. Create 2 Distinct Gym Tenants (Proving Multi-Gym & White-Label CMS Capability)
    const gym1 = await Gym.create({
      name: 'Titan Fitness & Gym',
      slug: 'titan-fitness-gurugram',
      tagline: 'Forge Your Ultimate Physique',
      phone: '+91 98765 43210',
      email: 'contact@titanfitness.com',
      address: 'Plot 42, Sector 18, Cyber City, Gurugram',
      taxNumber: 'GSTIN07AAACT1234F1Z5',
      currency: { code: 'INR', symbol: '₹' },
      primaryColor: '#6366f1', // FeeOrbit Indigo
      invoicePrefix: 'TF',
      receiptFooterNote: 'Thank you for training with Titan Fitness! Stay dedicated.',
      noticeBoard: {
        title: 'Gym Notice: Sunday Deep Clean',
        content: 'Gym will close at 6:00 PM this Sunday for routine sanitization and machine calibration.',
        isActive: true,
      },
      subscription: {
        plan: 'pro',
        planName: 'FeeOrbit Pro Growth',
        status: 'active',
        price: 1999,
        billingCycle: 'monthly',
        maxMembers: 500,
        features: ['Automated WhatsApp Invoices', 'Custom QR Access Cards', 'Staff & Equipment Management', 'Financial P&L Statements'],
      },
    });

    const gym2 = await Gym.create({
      name: 'Iron Core Athletic Club',
      slug: 'iron-core-delhi',
      tagline: 'High Performance Strength & Conditioning',
      phone: '+91 98111 88990',
      email: 'info@ironcoreclub.com',
      address: 'D-14, South Extension Part 2, New Delhi',
      taxNumber: 'GSTIN07AABCI9988H1Z2',
      currency: { code: 'INR', symbol: '₹' },
      primaryColor: '#06b6d4', // Cyber Cyan
      invoicePrefix: 'IC',
      receiptFooterNote: 'Iron Core: Building champions every day. Keep pushing boundaries!',
      noticeBoard: {
        title: 'New Powerlifting Workshop',
        content: 'Free Deadlift & Squat Form clinic this Saturday 11 AM conducted by Coach Rajesh.',
        isActive: true,
      },
      subscription: {
        plan: 'starter',
        planName: 'FeeOrbit Starter',
        status: 'trialing',
        price: 999,
        billingCycle: 'monthly',
        maxMembers: 100,
        features: ['Up to 100 Members', 'Digital Member Registry', 'Attendance Tracking', 'Basic Fee Receipts'],
      },
    });

    console.log(` Created 2 Gym Tenants: "${gym1.name}" and "${gym2.name}"`);

    // 2. Create Staff for Gym 1
    const staffG1 = await Staff.insertMany([
      {
        gym: gym1._id,
        name: 'Kabir Bakshi',
        role: 'Trainer',
        phone: '9870011223',
        email: 'kabir@titanfitness.com',
        specialization: 'Hypertrophy & Strength',
        salary: 35000,
        shift: 'Morning (6:00 AM - 2:00 PM)',
      },
      {
        gym: gym1._id,
        name: 'Simran Kaur',
        role: 'Trainer',
        phone: '9870022334',
        email: 'simran@titanfitness.com',
        specialization: 'HIIT & Functional Fitness',
        salary: 32000,
        shift: 'Evening (2:00 PM - 10:00 PM)',
      },
      {
        gym: gym1._id,
        name: 'Devendra Verma',
        role: 'Receptionist',
        phone: '9870033445',
        email: 'dev@titanfitness.com',
        specialization: 'Front Desk & CRM',
        salary: 22000,
        shift: 'Morning (6:00 AM - 2:00 PM)',
      },
    ]);

    console.log(` Created ${staffG1.length} staff members for ${gym1.name}.`);

    // 3. Create Equipment for Gym 1
    await Equipment.insertMany([
      {
        gym: gym1._id,
        name: 'Matrix T7xe Commercial Treadmill',
        category: 'Cardio',
        brand: 'Matrix Fitness',
        serialNumber: 'MX-T7-9021',
        purchaseCost: 280000,
        purchaseDate: new Date('2025-01-15'),
        maintenanceStatus: 'Operational',
        lastServicedDate: new Date('2026-08-01'),
        nextServiceDate: new Date('2026-11-01'),
        serviceContact: 'Matrix Tech Support (+91 99999 11111)',
      },
      {
        gym: gym1._id,
        name: 'Hammer Strength Dual Cable Cross',
        category: 'Strength',
        brand: 'Hammer Strength',
        serialNumber: 'HS-DCC-4410',
        purchaseCost: 350000,
        purchaseDate: new Date('2025-02-10'),
        maintenanceStatus: 'Operational',
        lastServicedDate: new Date('2026-07-20'),
        nextServiceDate: new Date('2026-10-20'),
        serviceContact: 'Hammer Support (+91 99999 22222)',
      },
      {
        gym: gym1._id,
        name: 'Rogue Olympic Power Rack Set',
        category: 'Free Weights',
        brand: 'Rogue Fitness',
        serialNumber: 'RG-PR-1188',
        purchaseCost: 190000,
        purchaseDate: new Date('2025-03-01'),
        maintenanceStatus: 'Needs Service',
        lastServicedDate: new Date('2026-06-15'),
        nextServiceDate: new Date('2026-09-10'),
        serviceContact: 'Local Rig Services (+91 99999 33333)',
      },
    ]);
    console.log(' Created Equipment inventory.');

    // 4. Create Operational Expenses for Gym 1 (ERP P&L)
    await Expense.insertMany([
      {
        gym: gym1._id,
        title: 'Premises Rent - Cyber City Facility',
        category: 'Rent',
        amount: 85000,
        date: new Date('2026-09-01'),
        paymentMethod: 'Bank Transfer',
        paidTo: 'DLF Commercial Properties',
        referenceNumber: 'RTGS-9912048',
        remarks: 'Monthly rent for 3,500 sq ft floor space',
      },
      {
        gym: gym1._id,
        title: 'Electricity & High-Ton AC Bill',
        category: 'Utilities',
        amount: 32000,
        date: new Date('2026-09-05'),
        paymentMethod: 'UPI',
        paidTo: 'DHBVN Haryana Power',
        referenceNumber: 'UPI-88441199',
        remarks: 'August billing cycle',
      },
      {
        gym: gym1._id,
        title: 'Trainer & Staff Salaries Advance',
        category: 'Staff Salaries',
        amount: 45000,
        date: new Date('2026-09-07'),
        paymentMethod: 'Bank Transfer',
        paidTo: 'Staff Accounts',
        referenceNumber: 'NEFT-SAL-0926',
        remarks: 'September salary advance',
      },
      {
        gym: gym1._id,
        title: 'Treadmill Belt Lubrication & Maintenance AMC',
        category: 'Equipment Maintenance',
        amount: 6500,
        date: new Date('2026-09-10'),
        paymentMethod: 'UPI',
        paidTo: 'Fitness Tech Solutions',
        referenceNumber: 'UPI-33112244',
        remarks: 'Quarterly maintenance checkup',
      },
    ]);
    console.log(' Created Operational expenses for P&L ledger.');

    // 5. Create Plans for Gym 1
    const plansG1 = await Plan.insertMany([
      {
        gym: gym1._id,
        name: 'Monthly Standard',
        durationMonths: 1,
        price: 1500,
        description: 'Standard access to gym floor and basic cardio equipment.',
        features: ['Gym Floor Access', 'Locker Room', 'Basic Cardio', 'Shower Facilities'],
        isActive: true,
      },
      {
        gym: gym1._id,
        name: 'Quarterly Beast',
        durationMonths: 3,
        price: 3800,
        description: 'Popular 3-month plan with steam bath and diet consultation.',
        features: ['Full Gym Access', 'Diet Consultation', 'Steam Bath Access', 'Free Fitness Assessment'],
        isActive: true,
      },
      {
        gym: gym1._id,
        name: 'Half-Yearly Elite',
        durationMonths: 6,
        price: 6800,
        description: 'Complete transformation package with 2 personal training sessions.',
        features: ['All Gym Facilities', '2 Free PT Sessions', 'Personal Locker', 'Body Composition Analysis'],
        isActive: true,
      },
      {
        gym: gym1._id,
        name: 'Annual Champion',
        durationMonths: 12,
        price: 11999,
        description: 'Year-round unlimited fitness access at the best value.',
        features: ['365 Days Access', 'Unlimited Steam', 'Dedicated Locker', 'Free Gym Kit & Shaker', 'Monthly Dietician Review'],
        isActive: true,
      },
      {
        gym: gym1._id,
        name: 'Personal Training VIP',
        durationMonths: 3,
        price: 14500,
        description: '1-on-1 dedicated certified trainer + diet and recovery planning.',
        features: ['1-on-1 Certified Trainer', 'Custom Workout Plan', 'Weekly Body Fat Tracking', 'Nutrition Strategy'],
        isActive: true,
      },
    ]);

    const [monthly, quarterly, halfYearly, annual, ptPlan] = plansG1;

    // Helper for dates
    const addDays = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    // 6. Create Members for Gym 1 (Assigned to Trainers!)
    const membersG1 = await Member.insertMany([
      {
        gym: gym1._id,
        memberId: 'TF-1001',
        fullName: 'Rahul Sharma',
        phone: '9876543210',
        email: 'rahul.sharma@example.com',
        gender: 'Male',
        dob: new Date('1996-04-12'),
        bloodGroup: 'B+',
        emergencyContact: { name: 'Kavita Sharma', phone: '9876543211', relation: 'Spouse' },
        address: 'Flat 402, Green Valley Apartments, Gurugram',
        plan: annual._id,
        assignedTrainer: staffG1[0]._id, // Assigned to Coach Kabir
        startDate: addDays(-60),
        endDate: addDays(305),
        status: 'active',
        lockerNumber: 'L-14',
      },
      {
        gym: gym1._id,
        memberId: 'TF-1002',
        fullName: 'Priya Patel',
        phone: '9811223344',
        email: 'priya.patel@example.com',
        gender: 'Female',
        dob: new Date('1998-08-23'),
        bloodGroup: 'O+',
        emergencyContact: { name: 'Mahesh Patel', phone: '9811223345', relation: 'Father' },
        address: 'B-12, DLF Phase 2, Gurugram',
        plan: quarterly._id,
        assignedTrainer: staffG1[1]._id, // Assigned to Coach Simran
        startDate: addDays(-75),
        endDate: addDays(15),
        status: 'active',
        lockerNumber: 'L-08',
      },
      {
        gym: gym1._id,
        memberId: 'TF-1003',
        fullName: 'Rohit Verma',
        phone: '9822334455',
        email: 'rohit.v@example.com',
        gender: 'Male',
        dob: new Date('1993-11-05'),
        bloodGroup: 'A+',
        emergencyContact: { name: 'Amit Verma', phone: '9822334456', relation: 'Brother' },
        address: 'H.No 310, Sector 23, Gurugram',
        plan: monthly._id,
        startDate: addDays(-27),
        endDate: addDays(3), // EXPIRING SOON!
        status: 'active',
        lockerNumber: 'L-22',
      },
      {
        gym: gym1._id,
        memberId: 'TF-1004',
        fullName: 'Ananya Singh',
        phone: '9833445566',
        email: 'ananya.s@example.com',
        gender: 'Female',
        dob: new Date('2001-02-14'),
        bloodGroup: 'AB+',
        emergencyContact: { name: 'Sunita Singh', phone: '9833445567', relation: 'Mother' },
        address: 'Tower C, Nirvana Country, Gurugram',
        plan: ptPlan._id,
        assignedTrainer: staffG1[0]._id, // Assigned to Coach Kabir
        startDate: addDays(-40),
        endDate: addDays(50),
        status: 'active',
        lockerNumber: 'VIP-03',
      },
      {
        gym: gym1._id,
        memberId: 'TF-1005',
        fullName: 'Karan Kapoor',
        phone: '9844556677',
        email: 'karan.k@example.com',
        gender: 'Male',
        dob: new Date('1990-07-19'),
        bloodGroup: 'O-',
        emergencyContact: { name: 'Simran Kapoor', phone: '9844556678', relation: 'Spouse' },
        address: 'Villa 18, Palm Drive, Gurugram',
        plan: halfYearly._id,
        startDate: addDays(-190),
        endDate: addDays(-10), // EXPIRED
        status: 'expired',
        lockerNumber: '',
      },
      {
        gym: gym1._id,
        memberId: 'TF-1006',
        fullName: 'Sneha Nair',
        phone: '9855667788',
        email: 'sneha.n@example.com',
        gender: 'Female',
        dob: new Date('1997-09-30'),
        bloodGroup: 'B-',
        emergencyContact: { name: 'Rajan Nair', phone: '9855667789', relation: 'Father' },
        address: 'Sector 54, Golf Course Road, Gurugram',
        plan: monthly._id,
        startDate: addDays(-26),
        endDate: addDays(4), // EXPIRING SOON!
        status: 'active',
        lockerNumber: 'L-31',
      },
    ]);
    console.log(` Created ${membersG1.length} members for ${gym1.name}.`);

    // 7. Create Attendance for Gym 1
    const todayStr = new Date().toISOString().split('T')[0];
    const attendanceG1 = [];

    for (let dayOffset = 6; dayOffset >= 1; dayOffset--) {
      const d = new Date();
      d.setDate(d.getDate() - dayOffset);
      const dateStr = d.toISOString().split('T')[0];
      const dailyCount = Math.floor(Math.random() * 3) + 3;
      for (let i = 0; i < dailyCount; i++) {
        const mem = membersG1[i % membersG1.length];
        const checkIn = new Date(d);
        checkIn.setHours(7 + i * 2, 15, 0);
        const checkOut = new Date(checkIn);
        const dur = 60 + i * 10;
        checkOut.setMinutes(checkIn.getMinutes() + dur);

        attendanceG1.push({
          gym: gym1._id,
          member: mem._id,
          memberId: mem.memberId,
          memberName: mem.fullName,
          checkIn,
          checkOut,
          date: dateStr,
          durationMinutes: dur,
          method: 'kiosk',
        });
      }
    }

    // Today's attendance
    attendanceG1.push({
      gym: gym1._id,
      member: membersG1[0]._id,
      memberId: membersG1[0].memberId,
      memberName: membersG1[0].fullName,
      checkIn: new Date(Date.now() - 3600000),
      checkOut: new Date(),
      date: todayStr,
      durationMinutes: 60,
      method: 'kiosk',
    });

    attendanceG1.push({
      gym: gym1._id,
      member: membersG1[1]._id,
      memberId: membersG1[1].memberId,
      memberName: membersG1[1].fullName,
      checkIn: new Date(Date.now() - 1800000),
      checkOut: null, // inside
      date: todayStr,
      durationMinutes: 0,
      method: 'kiosk',
    });

    await Attendance.insertMany(attendanceG1);
    console.log(` Created ${attendanceG1.length} attendance records.`);

    // 8. Create Payments for Gym 1
    await Payment.insertMany([
      {
        gym: gym1._id,
        receiptNumber: 'TF-2026-0001',
        member: membersG1[0]._id,
        memberName: membersG1[0].fullName,
        memberPhone: membersG1[0].phone,
        plan: annual._id,
        planName: annual.name,
        amountPaid: 11999,
        totalAmount: 11999,
        dueAmount: 0,
        paymentMethod: 'UPI',
        transactionId: 'UPI-982348912',
        paymentDate: addDays(-60),
        status: 'paid',
        remarks: 'Annual full payment via GPay',
      },
      {
        gym: gym1._id,
        receiptNumber: 'TF-2026-0002',
        member: membersG1[1]._id,
        memberName: membersG1[1].fullName,
        memberPhone: membersG1[1].phone,
        plan: quarterly._id,
        planName: quarterly.name,
        amountPaid: 3000,
        totalAmount: 3800,
        dueAmount: 800, // DUE
        paymentMethod: 'Cash',
        paymentDate: addDays(-15),
        dueDate: addDays(5),
        status: 'partial',
        remarks: 'Partial payment. ₹800 due next week.',
      },
      {
        gym: gym1._id,
        receiptNumber: 'TF-2026-0003',
        member: membersG1[3]._id,
        memberName: membersG1[3].fullName,
        memberPhone: membersG1[3].phone,
        plan: ptPlan._id,
        planName: ptPlan.name,
        amountPaid: 10000,
        totalAmount: 14500,
        dueAmount: 4500, // DUE
        paymentMethod: 'Card',
        transactionId: 'TXN-HDFC-9921',
        paymentDate: addDays(-12),
        dueDate: addDays(7),
        status: 'partial',
        remarks: 'VIP PT installment 1 paid. ₹4,500 due.',
      },
    ]);
    console.log(' Created Payment records.');

    // 9. Create 3 Distinct Authentication Roles (Admin, Staff, Member)
    await User.create([
      {
        name: 'Vikram Singhania (Gym Owner)',
        email: 'admin@titanfitness.com',
        password: 'Admin@123',
        role: 'admin',
        gym: gym1._id,
        phone: '+91 98765 43210',
        isEmailVerified: true,
      },
      {
        name: 'Coach Kabir Bakshi',
        email: 'staff@titanfitness.com',
        password: 'Staff@123',
        role: 'staff',
        gym: gym1._id,
        staffRef: staffG1[0]._id,
        phone: '9870011223',
        isEmailVerified: true,
      },
      {
        name: 'Rahul Sharma',
        email: 'member@titanfitness.com',
        password: 'Member@123',
        role: 'member',
        gym: gym1._id,
        memberRef: membersG1[0]._id,
        phone: '9812345678',
        isEmailVerified: true,
      },
    ]);
    console.log(' Created 3 Auth Users: Admin (admin@titanfitness.com), Staff (staff@titanfitness.com), Member (member@titanfitness.com).');

    console.log(' All-in-One Multi-Gym ERP & CMS Database Seeding Completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
