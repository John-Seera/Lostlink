const Claim = require('../models/Claim');
const Item = require('../models/Item');
const memoryStore = require('../config/memoryStore');
const { getIsConnectedToMongo } = require('../config/db');

// @desc Submit a claim for an item (FR11)
// @route POST /api/claims
exports.createClaim = async (req, res, next) => {
  try {
    const { itemId, message, verificationAnswer } = req.body;

    if (!itemId || !message || !verificationAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Please provide item ID, explanation of ownership, and verification details'
      });
    }

    const claimantId = req.user._id;

    if (getIsConnectedToMongo()) {
      const item = await Item.findById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      // Check if user is claiming their own reported item
      if (item.reportedBy.toString() === claimantId.toString()) {
        return res.status(400).json({
          success: false,
          message: 'You cannot submit a claim for an item you reported yourself'
        });
      }

      // Check if user already submitted a pending claim for this item
      const existingClaim = await Claim.findOne({
        itemId,
        claimantId,
        status: 'pending'
      });

      if (existingClaim) {
        return res.status(400).json({
          success: false,
          message: 'You already have a pending claim for this item'
        });
      }

      const claim = await Claim.create({
        itemId,
        claimantId,
        message: message.trim(),
        verificationAnswer: verificationAnswer.trim(),
        status: 'pending'
      });

      const populatedClaim = await Claim.findById(claim._id)
        .populate('itemId')
        .populate('claimantId', 'name email phone organization');

      return res.status(201).json({
        success: true,
        message: 'Claim submitted successfully. Awaiting verification review.',
        data: populatedClaim
      });
    } else {
      const item = memoryStore.getItemById(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found'
        });
      }

      const reportedById = item.reportedBy && item.reportedBy._id ? item.reportedBy._id : item.reportedBy;
      if (String(reportedById) === String(claimantId)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot submit a claim for an item you reported yourself'
        });
      }

      const claim = memoryStore.createClaim({
        itemId,
        claimantId,
        message: message.trim(),
        verificationAnswer: verificationAnswer.trim()
      });

      return res.status(201).json({
        success: true,
        message: 'Claim submitted successfully. Awaiting verification review.',
        data: claim
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Get current user's claims (FR11, FR12)
// @route GET /api/claims/my
exports.getMyClaims = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (getIsConnectedToMongo()) {
      const claims = await Claim.find({ claimantId: userId })
        .populate({
          path: 'itemId',
          populate: { path: 'reportedBy', select: 'name email organization' }
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: claims.length,
        data: claims
      });
    } else {
      const claims = memoryStore.getClaimsByUser(userId);
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

// @desc Update claim status (approve or reject)
// @route PUT /api/claims/:id
exports.updateClaim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

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

      // Allow either admin OR the person who reported the item to verify the claim
      const isReporter = claim.itemId && claim.itemId.reportedBy.toString() === userId.toString();
      if (!isAdmin && !isReporter) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to review this claim'
        });
      }

      claim.status = status;
      if (adminNotes !== undefined) claim.adminNotes = adminNotes;
      await claim.save();

      // If approved, update item status to claimed
      if (status === 'approved' && claim.itemId) {
        await Item.findByIdAndUpdate(claim.itemId._id, { status: 'claimed' });
      }

      const updatedClaim = await Claim.findById(id)
        .populate('itemId')
        .populate('claimantId', 'name email phone organization');

      return res.status(200).json({
        success: true,
        message: `Claim successfully marked as ${status}`,
        data: updatedClaim
      });
    } else {
      const claim = memoryStore.getClaimById(id);
      if (!claim) {
        return res.status(404).json({
          success: false,
          message: 'Claim not found'
        });
      }

      const item = claim.itemId;
      const reportedById = item && item.reportedBy ? (item.reportedBy._id || item.reportedBy) : null;
      const isReporter = reportedById && String(reportedById) === String(userId);

      if (!isAdmin && !isReporter) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to review this claim'
        });
      }

      const updated = memoryStore.updateClaim(id, { status, adminNotes });
      return res.status(200).json({
        success: true,
        message: `Claim successfully marked as ${status}`,
        data: updated
      });
    }
  } catch (error) {
    next(error);
  }
};
