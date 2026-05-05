require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const sportsData = [
  // Outdoor
  { name: 'Cricket', category: 'outdoor', totalFacilities: 3, usedFacilities: 0, icon: '🏏', image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400' },
  { name: 'Football', category: 'outdoor', totalFacilities: 2, usedFacilities: 0, icon: '⚽', image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400' },
  { name: 'Basketball', category: 'outdoor', totalFacilities: 4, usedFacilities: 0, icon: '🏀', image: 'https://images.unsplash.com/photo-1546519638405-a9f6b3674a5b?w=400' },
  { name: 'Volleyball', category: 'outdoor', totalFacilities: 2, usedFacilities: 0, icon: '🏐', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400' },
  { name: 'Pickleball', category: 'outdoor', totalFacilities: 6, usedFacilities: 0, icon: '🏓', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400' },
  { name: 'Tennis', category: 'outdoor', totalFacilities: 2, usedFacilities: 0, icon: '🎾', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400' },
  { name: 'Skating', category: 'outdoor', totalFacilities: 1, usedFacilities: 0, icon: '⛸️', image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=400' },
  // Indoor
  { name: 'Badminton', category: 'indoor', totalFacilities: 6, usedFacilities: 0, icon: '🏸', image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400' },
  { name: 'Carrom', category: 'indoor', totalFacilities: 5, usedFacilities: 0, icon: '🎯', image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400' },
  { name: 'Chess', category: 'indoor', totalFacilities: 4, usedFacilities: 0, icon: '♟️', image: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=400' },
  { name: 'Table Tennis', category: 'indoor', totalFacilities: 3, usedFacilities: 0, icon: '🏓', image: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=400' },
];

const equipmentData = [
  { name: 'Cricket Bat', sport: 'Cricket', totalQuantity: 10, availableQuantity: 10, icon: '🏏' },
  { name: 'Cricket Ball', sport: 'Cricket', totalQuantity: 20, availableQuantity: 20, icon: '🏏' },
  { name: 'Football', sport: 'Football', totalQuantity: 8, availableQuantity: 8, icon: '⚽' },
  { name: 'Basketball', sport: 'Basketball', totalQuantity: 8, availableQuantity: 8, icon: '🏀' },
  { name: 'Volleyball', sport: 'Volleyball', totalQuantity: 6, availableQuantity: 6, icon: '🏐' },
  { name: 'Tennis Racket', sport: 'Tennis', totalQuantity: 8, availableQuantity: 8, icon: '🎾' },
  { name: 'Tennis Ball', sport: 'Tennis', totalQuantity: 20, availableQuantity: 20, icon: '🎾' },
  { name: 'Badminton Racket', sport: 'Badminton', totalQuantity: 12, availableQuantity: 12, icon: '🏸' },
  { name: 'Shuttlecock', sport: 'Badminton', totalQuantity: 30, availableQuantity: 30, icon: '🏸' },
  { name: 'Table Tennis Paddle', sport: 'Table Tennis', totalQuantity: 8, availableQuantity: 8, icon: '🏓' },
  { name: 'Table Tennis Ball', sport: 'Table Tennis', totalQuantity: 20, availableQuantity: 20, icon: '🏓' },
  { name: 'Carrom Board', sport: 'Carrom', totalQuantity: 5, availableQuantity: 5, icon: '🎯' },
  { name: 'Carrom Coins Set', sport: 'Carrom', totalQuantity: 10, availableQuantity: 10, icon: '🎯' },
  { name: 'Chess Board Set', sport: 'Chess', totalQuantity: 8, availableQuantity: 8, icon: '♟️' },
  { name: 'Skating Helmet', sport: 'Skating', totalQuantity: 5, availableQuantity: 5, icon: '⛸️' },
  { name: 'Skating Knee Pads', sport: 'Skating', totalQuantity: 5, availableQuantity: 5, icon: '⛸️' },
];

const seedSports = async () => {
  try {
    const Sport = require('../models/Sport');
    const Equipment = require('../models/Equipment');

    await Sport.deleteMany({});
    await Equipment.deleteMany({});

    const sports = await Sport.insertMany(sportsData);
    const equipment = await Equipment.insertMany(equipmentData);

    console.log(`✅ Seeded ${sports.length} sports`);
    console.log(`✅ Seeded ${equipment.length} equipment items`);
    return { sports, equipment };
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    throw error;
  }
};

// Run standalone
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('🌱 Running seed script...');
      await seedSports();
      console.log('✅ Seed complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedSports };
