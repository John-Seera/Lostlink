const Item = require('../models/Item');
const memoryStore = require('../config/memoryStore');
const { getIsConnectedToMongo } = require('../config/db');

// @desc Create a lost or found item report (FR3 & FR4)
// @route POST /api/items
exports.createItem = async (req, res, next) => {
  try {
    const { type, title, category, color, description, location, date, imageUrl } = req.body;

    if (!type || !title || !category || !color || !description || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: type, title, category, color, description, and location'
      });
    }

    if (!['lost', 'found'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Item type must be either "lost" or "found"'
      });
    }

    const itemData = {
      type,
      title: title.trim(),
      category: category.trim(),
      color: color.trim(),
      description: description.trim(),
      location: location.trim(),
      date: date ? new Date(date) : new Date(),
      imageUrl: imageUrl || '',
      status: 'active',
      reportedBy: req.user._id
    };

    if (getIsConnectedToMongo()) {
      const item = await Item.create(itemData);
      const populatedItem = await Item.findById(item._id).populate('reportedBy', 'name email organization');
      return res.status(201).json({
        success: true,
        message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
        data: populatedItem
      });
    } else {
      const item = memoryStore.createItem(itemData);
      return res.status(201).json({
        success: true,
        message: `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
        data: item
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Browse all items with filters (FR5)
// @route GET /api/items
exports.getItems = async (req, res, next) => {
  try {
    const { type, category, status, search } = req.query;

    if (getIsConnectedToMongo()) {
      const query = {};
      if (type) query.type = type;
      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { color: { $regex: search, $options: 'i' } }
        ];
      }

      const items = await Item.find(query)
        .populate('reportedBy', 'name email organization')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } else {
      const items = memoryStore.getItems({
        type,
        category: category !== 'All' ? category : undefined,
        status: status !== 'All' ? status : undefined,
        search
      });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Search and filter items specifically (FR5)
// @route GET /api/items/search
exports.searchItems = async (req, res, next) => {
  try {
    const { q, type, category, color, location, date } = req.query;

    if (getIsConnectedToMongo()) {
      const query = {};
      if (type) query.type = type;
      if (category && category !== 'All') query.category = category;
      if (color) query.color = { $regex: color, $options: 'i' };
      if (location) query.location = { $regex: location, $options: 'i' };
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query.date = { $gte: targetDate, $lt: nextDay };
      }
      if (q) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { color: { $regex: q, $options: 'i' } }
        ];
      }

      const items = await Item.find(query)
        .populate('reportedBy', 'name email organization')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } else {
      const items = memoryStore.getItems({
        type,
        category: category !== 'All' ? category : undefined,
        color,
        location,
        search: q
      });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Get single item details (FR10)
// @route GET /api/items/:id
exports.getItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getIsConnectedToMongo()) {
      const item = await Item.findById(id).populate('reportedBy', 'name email phone organization');
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      return res.status(200).json({
        success: true,
        data: item
      });
    } else {
      const item = memoryStore.getItemById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }
      return res.status(200).json({
        success: true,
        data: item
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Update item report
// @route PUT /api/items/:id
exports.updateItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdminUser = req.user.role === 'admin';

    let item;
    if (getIsConnectedToMongo()) {
      item = await Item.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Check ownership
      if (item.reportedBy.toString() !== userId.toString() && !isAdminUser) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this item'
        });
      }

      const updated = await Item.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
        .populate('reportedBy', 'name email organization');

      return res.status(200).json({
        success: true,
        message: 'Item updated successfully',
        data: updated
      });
    } else {
      item = memoryStore.getItemById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      const reportedById = item.reportedBy && item.reportedBy._id ? item.reportedBy._id : item.reportedBy;
      if (String(reportedById) !== String(userId) && !isAdminUser) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this item'
        });
      }

      const updated = memoryStore.updateItem(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Item updated successfully',
        data: updated
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Delete item report
// @route DELETE /api/items/:id
exports.deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const isAdminUser = req.user.role === 'admin';

    if (getIsConnectedToMongo()) {
      const item = await Item.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      if (item.reportedBy.toString() !== userId.toString() && !isAdminUser) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this item'
        });
      }

      await item.deleteOne();
      return res.status(200).json({
        success: true,
        message: 'Item deleted successfully'
      });
    } else {
      const item = memoryStore.getItemById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      const reportedById = item.reportedBy && item.reportedBy._id ? item.reportedBy._id : item.reportedBy;
      if (String(reportedById) !== String(userId) && !isAdminUser) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this item'
        });
      }

      memoryStore.deleteItem(id);
      return res.status(200).json({
        success: true,
        message: 'Item deleted successfully'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Get items reported by current user
// @route GET /api/items/my/reports
exports.getMyReports = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (getIsConnectedToMongo()) {
      const items = await Item.find({ reportedBy: userId }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } else {
      const items = memoryStore.getItems({ reportedBy: userId });
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    }
  } catch (error) {
    next(error);
  }
};
