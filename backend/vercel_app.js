const { app } = require('./server.js');
const connectDB = require('./src/utils/db.js');

// Connect to DB immediately for serverless functions
connectDB().catch(console.error);

module.exports = app;
