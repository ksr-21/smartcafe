const QRCode = require('qrcode');

const generateQRCode = async (data, options = {}) => {
  const defaultOptions = {
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#FFFFFF',
    },
    width: 400,
    ...options,
  };

  try {
    const dataURL = await QRCode.toDataURL(data, defaultOptions);
    return dataURL;
  } catch (error) {
    throw new Error(`QR code generation failed: ${error.message}`);
  }
};

const generateQRBuffer = async (data, options = {}) => {
  const defaultOptions = {
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#FFFFFF',
    },
    width: 400,
    ...options,
  };

  try {
    const buffer = await QRCode.toBuffer(data, defaultOptions);
    return buffer;
  } catch (error) {
    throw new Error(`QR buffer generation failed: ${error.message}`);
  }
};

const generateTableQRUrl = (cafeId, tableQrToken, frontendUrl) => {
  const baseUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/menu/${cafeId}/${tableQrToken}`;
};

module.exports = { generateQRCode, generateQRBuffer, generateTableQRUrl };
