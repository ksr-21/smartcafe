const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  cafe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    default: null,
  },
  tableNumber: String,
  customerName: { type: String, default: 'Anonymous' },
  overallRating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  foodRating: { type: Number, min: 1, max: 5 },
  serviceRating: { type: Number, min: 1, max: 5 },
  ambianceRating: { type: Number, min: 1, max: 5 },
  comment: {
    type: String,
    maxlength: 500,
  },
  itemRatings: [
    {
      menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
      name: String,
      rating: Number,
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
