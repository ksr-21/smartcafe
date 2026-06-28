const { app } = require('./server.js');
const connectDB = require('./src/utils/db.js');

module.exports = async (req, res) => {
  await connectDB().catch(console.error);

  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url === '/' ? '' : req.url);
  }
  if (req.originalUrl && !req.originalUrl.startsWith('/api')) {
    req.originalUrl = '/api' + (req.originalUrl === '/' ? '' : req.originalUrl);
  }

  return app(req, res);
};
