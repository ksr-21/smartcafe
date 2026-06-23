const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true }, // snapshot
  price: { type: Number, required: true }, // snapshot
  image: { type: String, default: null },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  notes: {
    type: String,
    maxlength: 200,
  },
  customizations: [
    {
      name: String,
      selectedOption: String,
      extraPrice: { type: Number, default: 0 },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
  },
}, { _id: true });

const orderSchema = new mongoose.Schema({
  cafe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true,
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
  },
  tableNumber: { type: String, required: true }, // snapshot
  orderNumber: {
    type: String,
    unique: true,
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  statusHistory: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
  ],
  subtotal: { type: Number, default: 0 },
  gstRate: { type: Number, default: 5 },
  gstAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  customerName: { type: String, default: 'Guest' },
  customerMobile: { type: String, default: null },
  specialInstructions: { type: String, maxlength: 300 },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'online', null],
    default: null,
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    default: null,
  },
  estimatedTime: { type: Number, default: 20 }, // in minutes
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments({ cafe: this.cafe });
    const prefix = 'ORD';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    this.orderNumber = `${prefix}-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ cafe: 1, createdAt: -1 });
orderSchema.index({ cafe: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
