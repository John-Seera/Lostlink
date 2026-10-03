const express = require('express');
const router = express.Router();
const {
  getUsers,
  getItems,
  getClaims,
  manageClaim,
  updateItemStatus,
  deleteInappropriateItem,
  getPlatformStats
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

// All admin routes are protected and require admin role
router.use(protect);
router.use(isAdmin);

router.get('/users', getUsers);
router.get('/items', getItems);
router.get('/claims', getClaims);
router.put('/claims/:id', manageClaim);
router.put('/items/:id/status', updateItemStatus);
router.delete('/items/:id', deleteInappropriateItem);
router.get('/stats', getPlatformStats);

module.exports = router;
