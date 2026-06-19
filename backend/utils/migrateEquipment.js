require('dotenv').config();
const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const EquipmentRequest = require('../models/EquipmentRequest');

const migrateEquipment = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Initialize new fields for all Equipment
    const equipments = await Equipment.find();
    console.log(`Found ${equipments.length} equipment items.`);

    for (const eq of equipments) {
      eq.issuedQuantity = eq.issuedQuantity || 0;
      eq.damagedQuantity = eq.damagedQuantity || 0;
      eq.lostQuantity = eq.lostQuantity || 0;
      await eq.save();
    }
    console.log('✅ Initialized new quantities on all equipment.');

    // 2. Find all active (approved, issued, pending_return, partially_returned, overdue) requests
    const activeRequests = await EquipmentRequest.find({
      status: { $in: ['approved', 'issued', 'pending_return', 'partially_returned', 'overdue'] }
    });

    console.log(`Found ${activeRequests.length} active equipment requests.`);

    // Reset all equipment issuedQuantity before recalculating from active requests
    for (const eq of equipments) {
      eq.issuedQuantity = 0;
      await eq.save();
    }

    // 3. For each request, set expectedReturnDate if not set, and update equipment issuedQuantity
    for (const req of activeRequests) {
      // If it has status approved, update it to issued for consistency in our new system
      if (req.status === 'approved') {
        req.status = 'issued';
      }

      if (!req.expectedReturnDate) {
        const issueDate = req.issuedAt || req.createdAt;
        req.expectedReturnDate = new Date(new Date(issueDate).getTime() + 7 * 24 * 60 * 60 * 1000);
      }
      await req.save();

      // Adjust Equipment issued quantity
      const eq = await Equipment.findById(req.equipmentId);
      if (eq) {
        const remainingToReturn = req.quantity - (req.returnedQuantity || 0);
        eq.issuedQuantity += remainingToReturn;
        await eq.save();
      }
    }

    // 4. Recalculate available quantities to match invariant
    const finalEquipments = await Equipment.find();
    for (const eq of finalEquipments) {
      eq.availableQuantity = Math.max(0, eq.totalQuantity - eq.issuedQuantity - eq.damagedQuantity - eq.lostQuantity);
      await eq.save();
      console.log(`Updated inventory for ${eq.name}: Total: ${eq.totalQuantity}, Available: ${eq.availableQuantity}, Issued: ${eq.issuedQuantity}, Damaged: ${eq.damagedQuantity}, Lost: ${eq.lostQuantity}`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
};

migrateEquipment();
