const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB...");
    const result = await mongoose.connection.collection('users').updateOne(
      { email: 'admin@usport.edu' },
      { $set: { email: 'nikhilkr20062@gmail.com' } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('Successfully updated admin email to nikhilkr20062@gmail.com');
    } else {
      console.log('No user found with email admin@usport.edu or email is already updated.');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database Connection Error:", err);
    process.exit(1);
  });
