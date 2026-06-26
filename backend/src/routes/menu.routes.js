const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { upload, uploadToCloudinary } = require('../middleware/upload.middleware');

// ── CATEGORIES ───────────────────────────────────────────────────────────────

// GET /api/menu/categories
router.get('/categories', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const categories = await Category.find({ cafe: cafeId }).sort('sortOrder name');
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
});

// POST /api/menu/categories
router.post('/categories', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { name, description, sortOrder } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const category = await Category.create({ cafe: cafeId, name, description, sortOrder: sortOrder || 0 });
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
});

// PUT /api/menu/categories/:id
router.put('/categories/:id', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, cafe: cafeId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
});

// DELETE /api/menu/categories/:id
router.delete('/categories/:id', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const category = await Category.findOneAndDelete({ _id: req.params.id, cafe: cafeId });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    // Optionally unset category from items
    await MenuItem.updateMany({ cafe: cafeId, category: req.params.id }, { $unset: { category: 1 } });
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
});

// ── MENU ITEMS ───────────────────────────────────────────────────────────────

// GET /api/menu/items
router.get('/items', protect, async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const { category, available, search } = req.query;

    const filter = { cafe: cafeId };
    if (category) filter.category = category;
    if (available !== undefined) filter.isAvailable = available === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const items = await MenuItem.find(filter)
      .populate('category', 'name')
      .sort('sortOrder name');

    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch menu items.' });
  }
});

// POST /api/menu/items — Create item with image upload
router.post('/items', protect, authorize('cafe_admin', 'super_admin'),
  upload.single('image'), uploadToCloudinary, async (req, res) => {
    try {
      const cafeId = req.user.cafe?._id;
      const {
        name, description, price, discountedPrice, category, type,
        tags, isAvailable, isFeatured, isSpicy, preparationTime,
        calories, sortOrder, customizations,
      } = req.body;

      if (!name || !price || !category) {
        return res.status(400).json({ success: false, message: 'Name, price, and category are required.' });
      }

      const item = await MenuItem.create({
        cafe: cafeId,
        name,
        description,
        price: parseFloat(price),
        discountedPrice: discountedPrice ? parseFloat(discountedPrice) : null,
        category,
        type: type || 'veg',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
        isAvailable: isAvailable !== 'false',
        isFeatured: isFeatured === 'true',
        isSpicy: isSpicy === 'true',
        preparationTime: parseInt(preparationTime) || 15,
        calories: calories ? parseInt(calories) : null,
        sortOrder: parseInt(sortOrder) || 0,
        image: req.file?.cloudinaryUrl || null,
        imagePublicId: req.file?.cloudinaryPublicId || null,
        customizations: customizations ? JSON.parse(customizations) : [],
      });

      const populated = await MenuItem.findById(item._id).populate('category', 'name');
      res.status(201).json({ success: true, item: populated });
    } catch (error) {
      console.error('Create item error:', error);
      res.status(500).json({ success: false, message: 'Failed to create menu item.' });
    }
  }
);

// PUT /api/menu/items/:id
router.put('/items/:id', protect, authorize('cafe_admin', 'super_admin'),
  upload.single('image'), uploadToCloudinary, async (req, res) => {
    try {
      const cafeId = req.user.cafe?._id;
      const updates = { ...req.body };

      if (updates.price) updates.price = parseFloat(updates.price);
      if (updates.discountedPrice) updates.discountedPrice = parseFloat(updates.discountedPrice);
      if (updates.preparationTime) updates.preparationTime = parseInt(updates.preparationTime);
      if (updates.sortOrder) updates.sortOrder = parseInt(updates.sortOrder);
      if (updates.tags && typeof updates.tags === 'string') updates.tags = updates.tags.split(',');
      if (updates.customizations && typeof updates.customizations === 'string') {
        updates.customizations = JSON.parse(updates.customizations);
      }
      if (req.file?.cloudinaryUrl) {
        updates.image = req.file.cloudinaryUrl;
        updates.imagePublicId = req.file.cloudinaryPublicId;
      }

      const item = await MenuItem.findOneAndUpdate(
        { _id: req.params.id, cafe: cafeId },
        updates,
        { new: true, runValidators: true }
      ).populate('category', 'name');

      if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
      res.json({ success: true, item });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update menu item.' });
    }
  }
);

// PATCH /api/menu/items/:id/toggle — Toggle availability
router.patch('/items/:id/toggle', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const item = await MenuItem.findOne({ _id: req.params.id, cafe: cafeId });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });

    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, isAvailable: item.isAvailable, message: `Item ${item.isAvailable ? 'enabled' : 'disabled'}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle availability.' });
  }
});

// DELETE /api/menu/items/:id
router.delete('/items/:id', protect, authorize('cafe_admin', 'super_admin'), async (req, res) => {
  try {
    const cafeId = req.user.cafe?._id;
    const item = await MenuItem.findOneAndDelete({ _id: req.params.id, cafe: cafeId });
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete item.' });
  }
});

module.exports = router;
