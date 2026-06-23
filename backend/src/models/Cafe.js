const mongoose = require('mongoose');

const cafeSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: 100,
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
  },
  gstNumber: {
    type: String,
    trim: true,
    default: null,
  },
  gstRate: {
    type: Number,
    default: 5, // 5% GST
    min: 0,
    max: 28,
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  logo: {
    type: String,
    default: null,
  },
  coverImage: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  cuisine: [String],
  openingHours: {
    type: String,
    default: '9:00 AM - 10:00 PM',
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending', 'trial'],
    default: 'trial',
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },
    startDate: Date,
    endDate: Date,
    maxTables: { type: Number, default: 5 },
    maxMenuItems: { type: Number, default: 50 },
  },
  settings: {
    currency: { type: String, default: '₹' },
    currencyCode: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    orderNotificationSound: { type: Boolean, default: true },
    autoAcceptOrders: { type: Boolean, default: false },
    tableOccupancyTracking: { type: Boolean, default: true },
  },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Cafe', cafeSchema);
