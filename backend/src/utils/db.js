const mongoose = require('mongoose');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection.asPromise();
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/smartcafe';
    cachedPromise = mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const conn = await cachedPromise;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    cachedPromise = null;
    // process.exit(1);
  }
};

module.exports = connectDB;
