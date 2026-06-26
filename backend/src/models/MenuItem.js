const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  cafe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  discountedPrice: {
    type: Number,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  imagePublicId: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['veg', 'non-veg', 'vegan', 'egg'],
    default: 'veg',
  },
  tags: [String],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isSpicy: {
    type: Boolean,
    default: false,
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
  },
  calories: {
    type: Number,
    default: null,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  totalOrdered: {
    type: Number,
    default: 0,
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  customizations: [
    {
      name: String,
      options: [{ label: String, extraPrice: Number }],
    },
  ],
}, { timestamps: true });

// Index for search performance
menuItemSchema.index({ cafe: 1, isAvailable: 1 });
menuItemSchema.index({ cafe: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
