require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('./db');

const Cafe = require('../models/Cafe');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Order = require('../models/Order');
const { generateQRCode, generateTableQRUrl } = require('../services/qr.service');

const seed = async () => {
  await connectDB();

  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await Promise.all([
    Cafe.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Table.deleteMany({}),
    Order.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Create Super Admin ──────────────────────────────────────────────────
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'admin@smartcafe.app',
    password: 'Admin@123',
    role: 'super_admin',
    isActive: true,
  });
  console.log('✅ Super admin created: admin@smartcafe.app / Admin@123');

  // ── Create Demo Cafe ────────────────────────────────────────────────────
  const cafe = await Cafe.create({
    businessName: 'The Coffee House',
    ownerName: 'Raj Sharma',
    email: 'owner@thecoffeehouse.com',
    mobile: '+91 98765 43210',
    gstNumber: '27AAPFU0939F1ZV',
    gstRate: 5,
    address: {
      street: '12, MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      country: 'India',
    },
    description: 'A cozy cafe serving fresh coffee and delicious snacks in the heart of Bangalore.',
    cuisine: ['Coffee', 'Snacks', 'Sandwiches', 'Desserts'],
    openingHours: '8:00 AM - 11:00 PM',
    status: 'active',
    subscription: {
      plan: 'pro',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      maxTables: 50,
      maxMenuItems: 500,
    },
  });
  console.log('✅ Demo cafe created: The Coffee House');

  // ── Create Cafe Admin User ──────────────────────────────────────────────
  await User.create({
    name: 'Raj Sharma',
    email: 'owner@thecoffeehouse.com',
    password: 'Owner@123',
    mobile: '+91 98765 43210',
    role: 'cafe_admin',
    cafe: cafe._id,
    isActive: true,
  });
  console.log('✅ Cafe admin created: owner@thecoffeehouse.com / Owner@123');

  // ── Create Kitchen Staff ────────────────────────────────────────────────
  await User.create({
    name: 'Ravi Kumar',
    email: 'kitchen@thecoffeehouse.com',
    password: 'Kitchen@123',
    role: 'kitchen_staff',
    cafe: cafe._id,
    isActive: true,
  });
  console.log('✅ Kitchen staff created: kitchen@thecoffeehouse.com / Kitchen@123');

  // ── Create Categories ───────────────────────────────────────────────────
  const categories = await Category.insertMany([
    { cafe: cafe._id, name: 'Hot Beverages', sortOrder: 1 },
    { cafe: cafe._id, name: 'Cold Beverages', sortOrder: 2 },
    { cafe: cafe._id, name: 'Snacks', sortOrder: 3 },
    { cafe: cafe._id, name: 'Sandwiches', sortOrder: 4 },
    { cafe: cafe._id, name: 'Desserts', sortOrder: 5 },
    { cafe: cafe._id, name: 'Breakfast', sortOrder: 6 },
  ]);
  console.log('✅ Categories created:', categories.length);

  const [hotBev, coldBev, snacks, sandwiches, desserts, breakfast] = categories;

  // ── Create Menu Items ───────────────────────────────────────────────────
  const menuItems = [
    // Hot Beverages
    { cafe: cafe._id, category: hotBev._id, name: 'Espresso', price: 80, type: 'veg', preparationTime: 5, description: 'Rich and bold single shot espresso.', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400' },
    { cafe: cafe._id, category: hotBev._id, name: 'Cappuccino', price: 120, type: 'veg', preparationTime: 7, description: 'Classic cappuccino with steamed milk foam.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400' },
    { cafe: cafe._id, category: hotBev._id, name: 'Latte', price: 140, type: 'veg', preparationTime: 7, description: 'Smooth latte with velvety steamed milk.', image: 'https://images.unsplash.com/photo-1561882468-9110d70d2069?w=400' },
    { cafe: cafe._id, category: hotBev._id, name: 'Masala Chai', price: 60, type: 'veg', preparationTime: 5, description: 'Traditional Indian spiced tea.', image: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=400', isSpicy: true },
    // Cold Beverages
    { cafe: cafe._id, category: coldBev._id, name: 'Cold Coffee', price: 150, type: 'veg', preparationTime: 5, description: 'Chilled coffee blended with ice and milk.', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400' },
    { cafe: cafe._id, category: coldBev._id, name: 'Mango Smoothie', price: 160, type: 'veg', preparationTime: 5, description: 'Fresh mango blended with yogurt and honey.', image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400' },
    { cafe: cafe._id, category: coldBev._id, name: 'Lemonade', price: 80, type: 'veg', preparationTime: 3, description: 'Fresh squeezed lemonade with mint.', image: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400' },
    // Snacks
    { cafe: cafe._id, category: snacks._id, name: 'Veg Spring Rolls', price: 120, type: 'veg', preparationTime: 10, description: 'Crispy spring rolls with tangy dipping sauce.', image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=400' },
    { cafe: cafe._id, category: snacks._id, name: 'Chicken Wings', price: 220, type: 'non-veg', preparationTime: 15, description: 'Juicy grilled chicken wings with BBQ sauce.', image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400', isSpicy: true },
    { cafe: cafe._id, category: snacks._id, name: 'French Fries', price: 100, type: 'veg', preparationTime: 8, description: 'Golden crispy fries with seasoning.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400' },
    // Sandwiches
    { cafe: cafe._id, category: sandwiches._id, name: 'Club Sandwich', price: 180, type: 'non-veg', preparationTime: 12, description: 'Triple-decker sandwich with chicken, veggies.', image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400' },
    { cafe: cafe._id, category: sandwiches._id, name: 'Veg Grilled Sandwich', price: 130, type: 'veg', preparationTime: 10, description: 'Toasted sandwich with fresh vegetables and cheese.', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400' },
    // Desserts
    { cafe: cafe._id, category: desserts._id, name: 'Chocolate Brownie', price: 120, type: 'veg', preparationTime: 5, description: 'Warm fudgy brownie with vanilla ice cream.', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400', isFeatured: true },
    { cafe: cafe._id, category: desserts._id, name: 'Cheesecake', price: 160, type: 'veg', preparationTime: 5, description: 'New York style creamy cheesecake.', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400' },
    // Breakfast
    { cafe: cafe._id, category: breakfast._id, name: 'Pancakes', price: 140, type: 'veg', preparationTime: 15, description: 'Fluffy pancakes with maple syrup and butter.', image: 'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400', isFeatured: true },
    { cafe: cafe._id, category: breakfast._id, name: 'Avocado Toast', price: 180, type: 'vegan', preparationTime: 10, description: 'Sourdough toast topped with fresh avocado and herbs.', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=400' },
  ];

  await MenuItem.insertMany(menuItems);
  console.log('✅ Menu items created:', menuItems.length);

  // ── Create Tables ───────────────────────────────────────────────────────
  const tableData = [];
  for (let i = 1; i <= 10; i++) {
    const tableNumber = String(i);
    const location = i <= 6 ? 'Indoor' : 'Outdoor';

    const table = new Table({
      cafe: cafe._id,
      tableNumber,
      displayName: `Table ${i}`,
      capacity: [2, 4, 4, 6][Math.floor(Math.random() * 4)],
      location,
    });

    const qrUrl = generateTableQRUrl(cafe._id, table.qrToken);
    table.qrCodeUrl = await generateQRCode(qrUrl);
    tableData.push(table);
  }

  const savedTables = await Table.insertMany(tableData);
  console.log('✅ Tables created with QR codes:', savedTables.length);

  // ── Create Sample Orders ────────────────────────────────────────────────
  const items = await MenuItem.find({ cafe: cafe._id });
  const sampleOrders = [];

  for (let i = 0; i < 15; i++) {
    const table = savedTables[i % savedTables.length];
    const orderItems = [];
    let subtotal = 0;

    const numItems = Math.ceil(Math.random() * 3);
    for (let j = 0; j < numItems; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const qty = Math.ceil(Math.random() * 2);
      const itemSubtotal = item.price * qty;
      subtotal += itemSubtotal;
      orderItems.push({
        menuItem: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: qty,
        subtotal: itemSubtotal,
      });
    }

    const gstAmount = (subtotal * cafe.gstRate) / 100;
    const status = ['completed', 'completed', 'completed', 'preparing', 'served'][i % 5];

    const createdAt = new Date(Date.now() - i * 3 * 60 * 60 * 1000); // last few hours

    sampleOrders.push({
      cafe: cafe._id,
      table: table._id,
      tableNumber: table.tableNumber,
      items: orderItems,
      subtotal,
      gstRate: cafe.gstRate,
      gstAmount,
      totalAmount: subtotal + gstAmount,
      status,
      customerName: ['Priya', 'Amit', 'Sneha', 'Ravi', 'Anita'][i % 5],
      paymentStatus: status === 'completed' ? 'paid' : 'unpaid',
      paymentMethod: status === 'completed' ? ['cash', 'upi', 'card'][i % 3] : null,
      statusHistory: [{ status: 'pending', timestamp: createdAt }],
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 20 * 60 * 1000),
    });
  }

  for (const orderData of sampleOrders) {
    const order = new Order(orderData);
    await order.save();
  }
  console.log('✅ Sample orders created:', sampleOrders.length);

  // Update cafe stats
  const completedOrders = sampleOrders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  await Cafe.findByIdAndUpdate(cafe._id, {
    totalRevenue,
    totalOrders: completedOrders.length,
  });

  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Login Credentials:');
  console.log('');
  console.log('  Super Admin:');
  console.log('    Email:    admin@smartcafe.app');
  console.log('    Password: Admin@123');
  console.log('');
  console.log('  Cafe Admin (The Coffee House):');
  console.log('    Email:    owner@thecoffeehouse.com');
  console.log('    Password: Owner@123');
  console.log('');
  console.log('  Kitchen Staff:');
  console.log('    Email:    kitchen@thecoffeehouse.com');
  console.log('    Password: Kitchen@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  mongoose.connection.close();
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
