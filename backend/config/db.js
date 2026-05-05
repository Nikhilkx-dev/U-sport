const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed on first connect
    const Sport = require('../models/Sport');
    const count = await Sport.countDocuments();
    if (count === 0) {
      console.log('🌱 No sports found. Running seed...');
      const { seedSports } = require('../utils/seedSports');
      await seedSports();
    }
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
