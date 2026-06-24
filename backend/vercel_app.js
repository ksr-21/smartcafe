const { app } = require('./server.js');
const connectDB = require('./src/utils/db.js');

module.exports = async (req, res) => {
  await connectDB().catch(console.error);
  return app(req, res);
};
