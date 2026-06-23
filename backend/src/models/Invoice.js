const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  cafe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cafe',
    required: true,
    index: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  invoiceNumber: {
    type: String,
    unique: true,
  },
  // Cafe snapshot at time of invoice
  cafeSnapshot: {
    businessName: String,
    address: Object,
    gstNumber: String,
    mobile: String,
    email: String,
    logo: String,
  },
  tableNumber: String,
  customerName: String,
  customerMobile: String,
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      subtotal: Number,
    },
  ],
  subtotal: { type: Number, required: true },
  gstRate: { type: Number, default: 5 },
  gstAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: String,
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: 'unpaid',
  },
  pdfUrl: {
    type: String,
    default: null,
  },
  notes: String,
}, { timestamps: true });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments({ cafe: this.cafe });
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
