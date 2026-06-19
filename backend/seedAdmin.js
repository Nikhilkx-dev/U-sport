const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB...");

    const adminEmail = 'admin@usport.edu';
    const adminPassword = 'Admin@12345';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin already exists. Updating password...");
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      console.log("Admin password updated!");
    } else {
      console.log("Creating new admin...");
      const admin = new User({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        department: 'Sports Department',
        isEmailVerified: true
      });
      await admin.save();
      console.log("Admin created successfully!");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAdmin();
