const express = require('express');
const router = express.Router();
const { createClaim, getMyClaims, updateClaim } = require('../controllers/claimController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createClaim);
router.get('/my', protect, getMyClaims);
router.put('/:id', protect, updateClaim);

module.exports = router;
