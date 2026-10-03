const express = require('express');
const router = express.Router();
const {
  createItem,
  getItems,
  searchItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyReports
} = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getItems);
router.get('/search', searchItems);
router.get('/my/reports', protect, getMyReports);
router.get('/:id', getItemById);
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;
