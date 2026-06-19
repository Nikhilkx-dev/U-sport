/**
 * 🔐 Admin Seed Script
 * 
 * Usage:
 *   node utils/seedAdmin.js
 * 
 * This creates an admin user or promotes an existing user to admin.
 * Admin cannot be created through the public API — only via this script.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@usport.edu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const ADMIN_NAME = process.env.ADMIN_NAME || 'USport Admin';
const ADMIN_DEPARTMENT = process.env.ADMIN_DEPARTMENT || 'Sports Administration';

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await User.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      if (existing.role === 'admin') {
        console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
      } else {
        // Promote existing user to admin
        existing.role = 'admin';
        existing.isEmailVerified = true;
        await existing.save({ validateBeforeSave: false });
        console.log(`✅ Promoted existing user to admin: ${ADMIN_EMAIL}`);
      }
    } else {
      // Create new admin user
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        department: ADMIN_DEPARTMENT,
        isEmailVerified: true
      });
      console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }

    console.log('\n🔐 Admin credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n⚠️  Change these in production via environment variables:');
    console.log('   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_DEPARTMENT');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Also export a function to promote any user to admin by email
const promoteToAdmin = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }
    user.role = 'admin';
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
    console.log(`✅ ${email} promoted to admin`);
  } catch (error) {
    console.error('❌ Promotion failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

// CLI support: node utils/seedAdmin.js [promote email@example.com]
const args = process.argv.slice(2);
if (args[0] === 'promote' && args[1]) {
  promoteToAdmin(args[1]);
} else {
  seedAdmin();
}
