const express = require('express');
const router = express.Router();
const { chat, extractAndMatch, getChatHistory } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Chatbot endpoint (works both unauthenticated and authenticated)
router.post('/chat', (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, () => chat(req, res, next));
  }
  return chat(req, res, next);
});

// Dedicated structured extraction & weighted matching engine endpoint
router.post('/extract', extractAndMatch);

// User chat history
router.get('/chat/history', protect, getChatHistory);

module.exports = router;
