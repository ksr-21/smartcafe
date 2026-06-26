const { app } = require('./server.js');
const connectDB = require('./src/utils/db.js');

module.exports = async (req, res) => {
  await connectDB().catch(console.error);

  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }

  return app(req, res);
};
