require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Equipment = require('../models/Equipment');
const EquipmentRequest = require('../models/EquipmentRequest');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const reqs = await EquipmentRequest.find().populate('equipmentId').populate('studentId');
  console.log('Total Requests:', reqs.length);
  reqs.forEach(r => {
    console.log(`ID: ${r._id}, Student: ${r.studentId?.email}, Equip: ${r.equipmentId?.name}, Status: ${r.status}, Qty: ${r.quantity}, Returned Qty: ${r.returnedQuantity}`);
  });
  await mongoose.disconnect();
}
check();
