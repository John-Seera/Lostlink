const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const memoryStore = require('../config/memoryStore');
const { getIsConnectedToMongo } = require('../config/db');

// @desc Get all registered users (FR13)
// @route GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    if (getIsConnectedToMongo()) {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } else {
      const users = memoryStore.getAllUsers();
      return res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Get all items (lost & found) for admin oversight (FR13)
// @route GET /api/admin/items
exports.getItems = async (req, res, next) => {
  try {
    if (getIsConnectedToMongo()) {
      const items = await Item.find()
        .populate('reportedBy', 'name email phone organization')
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items
      });
    } else {
      const items = memoryStore.getItems();
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

// @desc Get all claims across platform (FR13)
// @route GET /api/admin/claims
exports.getClaims = async (req, res, next) => {
  try {
    if (getIsConnectedToMongo()) {
      const claims = await Claim.find()
        .populate('itemId')
        .populate('claimantId', 'name email phone organization')
        .sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        count: claims.length,
        data: claims
      });
    } else {
      const claims = memoryStore.getAllClaims();
      return res.status(200).json({
        success: true,
        count: claims.length,
        data: claims
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Admin manage claim (approve or reject) (FR13)
// @route PUT /api/admin/claims/:id
exports.manageClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be pending, approved, or rejected'
      });
    }

    if (getIsConnectedToMongo()) {
      const claim = await Claim.findById(id).populate('itemId');
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      claim.status = status;
      if (adminNotes !== undefined) claim.adminNotes = adminNotes;
      await claim.save();

      // If approved, update item status to claimed
      if (status === 'approved' && claim.itemId) {
        await Item.findByIdAndUpdate(claim.itemId._id, { status: 'claimed' });
      }

      const updated = await Claim.findById(id)
        .populate('itemId')
        .populate('claimantId', 'name email phone organization');

      return res.status(200).json({
        success: true,
        message: `Claim has been successfully updated to ${status}`,
        data: updated
      });
    } else {
      const claim = memoryStore.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      const updated = memoryStore.updateClaim(id, { status, adminNotes });
      return res.status(200).json({
        success: true,
        message: `Claim has been successfully updated to ${status}`,
        data: updated
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Admin update item status (mark as matched / closed / active) (FR13)
// @route PUT /api/admin/items/:id/status
exports.updateItemStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'matched', 'claimed', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, matched, claimed, or closed'
      });
    }

    if (getIsConnectedToMongo()) {
      const item = await Item.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate('reportedBy', 'name email organization');

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Item status updated to ${status}`,
        data: item
      });
    } else {
      const item = memoryStore.updateItem(id, { status });
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: `Item status updated to ${status}`,
        data: item
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Admin remove inappropriate report (FR13)
// @route DELETE /api/admin/items/:id
exports.deleteInappropriateItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (getIsConnectedToMongo()) {
      const item = await Item.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      await item.deleteOne();
      await Claim.deleteMany({ itemId: id });

      return res.status(200).json({
        success: true,
        message: 'Inappropriate item report removed successfully'
      });
    } else {
      const deleted = memoryStore.deleteItem(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Inappropriate item report removed successfully'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Get platform statistics for dashboard
// @route GET /api/admin/stats
exports.getPlatformStats = async (req, res, next) => {
  try {
    if (getIsConnectedToMongo()) {
      const totalUsers = await User.countDocuments();
      const totalLost = await Item.countDocuments({ type: 'lost' });
      const totalFound = await Item.countDocuments({ type: 'found' });
      const activeItems = await Item.countDocuments({ status: 'active' });
      const resolvedItems = await Item.countDocuments({ status: { $in: ['claimed', 'closed'] } });
      const totalClaims = await Claim.countDocuments();
      const pendingClaims = await Claim.countDocuments({ status: 'pending' });
      const approvedClaims = await Claim.countDocuments({ status: 'approved' });

      return res.status(200).json({
        success: true,
        data: {
          totalUsers,
          totalLost,
          totalFound,
          activeItems,
          resolvedItems,
          totalClaims,
          pendingClaims,
          approvedClaims
        }
      });
    } else {
      const stats = memoryStore.getStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    }
  } catch (error) {
    next(error);
  }
};
