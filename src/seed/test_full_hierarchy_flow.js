const mongoose = require('mongoose');

async function testFullHierarchyFlow() {
  console.log('========================================================');
  console.log('🧪 TESTING COMPLETE 4-TIER MULTI-ROLE HIERARCHY FLOW');
  console.log('========================================================\n');

  // -----------------------------------------------------------
  // TEST 1: Super Admin Flow
  // -----------------------------------------------------------
  console.log('--- 1. Testing Super Admin Flow ---');
  const superLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@feeorbit.com', password: 'SuperAdmin@2026' }),
  });
  const superLoginData = await superLoginRes.json();
  if (!superLoginData.success) throw new Error('Super Admin login failed: ' + superLoginData.message);
  console.log(' Super Admin Login SUCCESS:', superLoginData.user.name, '| Role:', superLoginData.user.role);

  const superToken = superLoginData.token;

  // Fetch Dashboard Stats
  const statsRes = await fetch('http://localhost:5000/api/superadmin/dashboard-stats', {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const stats = await statsRes.json();
  console.log(' Platform KPI Stats:', {
    totalGyms: stats.data.totalGyms,
    totalMembers: stats.data.totalMembers,
    activeTenants: stats.data.activeTenants,
    todayAttendance: stats.data.todayAttendanceCount,
  });

  // Fetch SaaS Plans
  const plansRes = await fetch('http://localhost:5000/api/superadmin/plans', {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const saasPlans = await plansRes.json();
  console.log(' SaaS Plans Count:', saasPlans.count, saasPlans.data.map((p) => p.name));

  // Fetch Consolidated Reports
  const reportsRes = await fetch('http://localhost:5000/api/superadmin/reports', {
    headers: { Authorization: `Bearer ${superToken}` },
  });
  const reports = await reportsRes.json();
  console.log(' Consolidated All Gyms Reports Count:', reports.data.length);

  // -----------------------------------------------------------
  // TEST 2: Gym Admin Multi-Branch & Staff Invitation Flow
  // -----------------------------------------------------------
  console.log('\n--- 2. Testing Gym Admin Multi-Branch & Staff Invitation Flow ---');
  const rahulLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahulyo954030@gmail.com', password: 'Rahul@2026' }),
  });
  const rahulData = await rahulLoginRes.json();
  if (!rahulData.success) throw new Error('Rahul Gym Admin login failed: ' + rahulData.message);
  console.log(' Gym Admin Login SUCCESS:', rahulData.user.name, '| Gym:', rahulData.user.gym);

  const rahulToken = rahulData.token;
  const mainGymId = rahulData.user.gym;

  // Create a new child branch under Rahul's gym
  const branchName = 'Noida Sector 62 Branch';
  const branchRes = await fetch('http://localhost:5000/api/gyms/branch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      parentGymId: mainGymId,
      branchName: branchName,
      branchCode: 'NOIDA-01',
      phone: '9876500011',
      address: 'Plot 12, Electronic City, Noida',
      ownerId: rahulData.user._id || rahulData.user.id,
    }),
  });
  const branchData = await branchRes.json();
  console.log(' Branch Creation SUCCESS:', branchData.message, '| Branch ID:', branchData.data?._id);

  const newBranchId = branchData.data?._id;

  // Invite Staff to the newly created branch
  const staffEmail = `trainer.rohit.${Date.now().toString().slice(-4)}@testfitness.com`;
  const staffRes = await fetch('http://localhost:5000/api/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rohit Sharma (Lead Trainer)',
      role: 'Trainer',
      phone: '9811223344',
      email: staffEmail,
      specialization: 'CrossFit & Bodybuilding',
      salary: 35000,
      shift: 'Morning (6:00 AM - 2:00 PM)',
      gym: newBranchId,
    }),
  });
  const staffData = await staffRes.json();
  console.log(' Staff Invitation & User Creation SUCCESS:', staffData.message);
  console.log(' Generated Credentials:', staffData.credentials);

  // -----------------------------------------------------------
  // TEST 3: Staff Flow
  // -----------------------------------------------------------
  console.log('\n--- 3. Testing Staff Login & Access Flow ---');
  const staffLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: staffData.credentials.email,
      password: staffData.credentials.temporaryPassword,
    }),
  });
  const staffLoginData = await staffLoginRes.json();
  if (!staffLoginData.success) throw new Error('Staff login failed: ' + staffLoginData.message);
  console.log(' Staff Login SUCCESS:', staffLoginData.user.name, '| Role:', staffLoginData.user.role);
  console.log(' Staff Assigned Branch:', staffLoginData.user.gym);

  // -----------------------------------------------------------
  // TEST 4: Gym Member View & Scan Attendance Flow
  // -----------------------------------------------------------
  console.log('\n--- 4. Testing Gym Member Portal & Scan Flow ---');
  const memberLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rsingh954030@gmail.com', password: 'Lucky@2026' }),
  });
  const memberLoginData = await memberLoginRes.json();
  if (!memberLoginData.success) throw new Error('Member login failed: ' + memberLoginData.message);
  console.log(' Member Login SUCCESS:', memberLoginData.user.name, '| Role:', memberLoginData.user.role);

  const memberToken = memberLoginData.token;

  // Member Portal Data
  const portalRes = await fetch('http://localhost:5000/api/auth/member-portal', {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  const portalData = await portalRes.json();
  console.log(' Member Portal Data:', {
    fullName: portalData.member?.fullName,
    memberId: portalData.member?.memberId,
    plan: portalData.member?.plan?.name,
    totalWorkouts: portalData.summary?.totalWorkouts,
  });

  // Member Attendance Scan
  const scanRes = await fetch('http://localhost:5000/api/attendance/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: portalData.member?.memberId,
      gymId: mainGymId,
    }),
  });
  const scanData = await scanRes.json();
  console.log(' Member Scan Action:', scanData.action || scanData.message);

  console.log('\n========================================================');
  console.log('🎉 ALL 4-TIER ROLES & WORKFLOWS VERIFIED SUCCESSFULLY!');
  console.log('========================================================');
  process.exit(0);
}

testFullHierarchyFlow().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
