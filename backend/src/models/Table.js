const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tableSchema = new mongoose.Schema({
  cafe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true,
  },
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    trim: true,
  },
  displayName: {
    type: String,
    trim: true,
  },
  capacity: {
    type: Number,
    default: 4,
  },
  qrToken: {
    type: String,
    unique: true,
    default: () => uuidv4(),
  },
  qrCodeUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available',
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  location: {
    type: String, // e.g., "Indoor", "Outdoor", "Rooftop"
    default: 'Indoor',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Compound unique index per cafe
tableSchema.index({ cafe: 1, tableNumber: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
