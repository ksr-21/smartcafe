const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Configure Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use disk storage as fallback (when Cloudinary not configured)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WEBP)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Middleware to upload file to Supabase Storage (or return local path)
const uploadToCloudinary = async (req, res, next) => {
  if (!req.file) return next();

  const isSupabaseConfigured =
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (isSupabaseConfigured) {
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const cafeFolder = req.user?.cafe?._id || 'general';
      const fileName = `${cafeFolder}/${Date.now()}-${path.basename(req.file.originalname)}`;

      // Upload to 'smartcafe-images' bucket
      const { data, error } = await supabase.storage
        .from('smartcafe-images')
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('smartcafe-images')
        .getPublicUrl(fileName);

      req.file.cloudinaryUrl = publicUrl;
      req.file.cloudinaryPublicId = fileName;

      // Clean up local temp file
      fs.unlink(req.file.path, () => {});
    } catch (err) {
      console.error('Supabase Storage upload error:', err);
      req.file.cloudinaryUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
      req.file.cloudinaryPublicId = null;
    }
  } else {
    // Serve locally for development
    req.file.cloudinaryUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
    req.file.cloudinaryPublicId = null;
  }

  next();
};

// Delete from Supabase Storage
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  const isSupabaseConfigured =
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase.storage
      .from('smartcafe-images')
      .remove([publicId]);
    if (error) throw error;
  } catch (err) {
    console.error('Supabase Storage delete error:', err);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
