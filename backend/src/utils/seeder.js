/**
 * Database Seeder
 * Seeds the initial Admin account
 * Run: npm run seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const connectDB = require('../config/database');

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin already exists. Skipping seed.');
      console.log(`   Email: ${existingAdmin.email}`);
      process.exit(0);
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@hdfclife.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
      role: 'admin',
    });

    console.log('\n🌱 Database seeded successfully!');
    console.log('─────────────────────────────────────────');
    console.log('Admin Account Created:');
    console.log(`  Name  : ${admin.name}`);
    console.log(`  Email : ${admin.email}`);
    console.log(`  Role  : ${admin.role}`);
    console.log('─────────────────────────────────────────');
    console.log('⚠️  Change the admin password immediately after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();
