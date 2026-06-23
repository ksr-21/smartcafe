const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  cafe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
