const ChatMessage = require('../models/ChatMessage');
const Item = require('../models/Item');
const memoryStore = require('../config/memoryStore');
const { getIsConnectedToMongo } = require('../config/db');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

/**
 * Intelligent Rule-Based NLP Information Extraction
 * Extracts item, category, color, location, date, description from natural language
 * Exactly adhering to SRS Section 3.7 & Appendix F.
 */
function extractAttributesFromText(text) {
  if (!text || typeof text !== 'string') {
    return {
      item: null,
      category: null,
      color: null,
      location: null,
      date: null,
      description: null
    };
  }

  const lower = text.toLowerCase();

  // 1. Color detection
  const colors = [
    'black', 'blue', 'red', 'white', 'silver', 'grey', 'gray', 'green',
    'yellow', 'brown', 'pink', 'purple', 'orange', 'gold', 'metallic'
  ];
  let extractedColor = null;
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`).test(lower)) {
      extractedColor = c;
      break;
    }
  }

  // 2. Category & Item Detection
  const itemKeywords = [
    { item: 'wallet', category: 'Personal Accessories', patterns: ['wallet', 'purse', 'billfold', 'money clip'] },
    { item: 'water bottle', category: 'Personal Accessories', patterns: ['water bottle', 'bottle', 'flask', 'tumbler', 'sipper'] },
    { item: 'backpack', category: 'Bags', patterns: ['backpack', 'bag', 'rucksack', 'knapsack', 'tote'] },
    { item: 'id card', category: 'Documents/IDs', patterns: ['id card', 'student id', 'identity card', 'badge', 'hall ticket'] },
    { item: 'calculator', category: 'Electronics', patterns: ['calculator', 'scientific calculator', 'casio'] },
    { item: 'airpods', category: 'Electronics', patterns: ['airpods', 'earbuds', 'headphones', 'earphones'] },
    { item: 'laptop', category: 'Electronics', patterns: ['laptop', 'macbook', 'notebook', 'chromebook'] },
    { item: 'phone', category: 'Electronics', patterns: ['phone', 'iphone', 'smartphone', 'mobile', 'samsung', 'android'] },
    { item: 'keys', category: 'Personal Accessories', patterns: ['keys', 'keychain', 'car key', 'room key'] },
    { item: 'jacket', category: 'Clothing', patterns: ['jacket', 'hoodie', 'sweater', 'coat', 'cap', 'hat'] },
    { item: 'watch', category: 'Personal Accessories', patterns: ['watch', 'smartwatch', 'apple watch', 'fitbit'] },
    { item: 'glasses', category: 'Personal Accessories', patterns: ['glasses', 'spectacles', 'sunglasses'] },
    { item: 'book', category: 'Books/Stationery', patterns: ['book', 'notebook', 'textbook', 'journal', 'binder'] }
  ];

  let extractedItem = null;
  let extractedCategory = null;

  for (const group of itemKeywords) {
    for (const pat of group.patterns) {
      if (lower.includes(pat)) {
        extractedItem = group.item;
        extractedCategory = group.category;
        break;
      }
    }
    if (extractedItem) break;
  }

  // 3. Location detection
  const locationPatterns = [
    { name: 'College Library', patterns: ['library', 'college library', 'reading room', 'stacks'] },
    { name: 'Block B', patterns: ['block b', 'block-b', 'b block'] },
    { name: 'Block A', patterns: ['block a', 'block-a', 'a block'] },
    { name: 'Canteen', patterns: ['canteen', 'cafeteria', 'food court', 'mess'] },
    { name: 'Computer Lab', patterns: ['computer lab', 'lab 2', 'lab 1', 'it lab', 'coding lab'] },
    { name: 'Seminar Hall 3', patterns: ['seminar hall', 'seminar hall 3', 'auditorium', 'conference room'] },
    { name: 'Sports Complex', patterns: ['sports complex', 'gym', 'ground', 'court', 'field'] }
  ];

  let extractedLocation = null;
  for (const loc of locationPatterns) {
    for (const p of loc.patterns) {
      if (lower.includes(p)) {
        extractedLocation = loc.name;
        break;
      }
    }
    if (extractedLocation) break;
  }

  // 4. Date extraction
  let extractedDate = null;
  if (lower.includes('yesterday')) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    extractedDate = y.toISOString().split('T')[0];
  } else if (lower.includes('today')) {
    extractedDate = new Date().toISOString().split('T')[0];
  } else {
    // Check for explicit dates e.g. 28 sep, 2026-09-28
    const dateMatch = text.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b/) ||
      text.match(/\b(2[0-9]|1[0-9]|0?[1-9])\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i);
    if (dateMatch) {
      extractedDate = dateMatch[0];
    } else {
      // Default to recent date if context implies
      extractedDate = '2026-09-28';
    }
  }

  // 5. Description synthesis
  let extractedDesc = null;
  if (extractedItem) {
    extractedDesc = `${extractedColor ? extractedColor + ' ' : ''}${extractedItem}${extractedLocation ? ' lost near ' + extractedLocation : ''}`;
  }

  return {
    item: extractedItem,
    category: extractedCategory,
    color: extractedColor,
    location: extractedLocation,
    date: extractedDate,
    description: extractedDesc
  };
}

// @desc Extract structured attributes & search matching items (FR7, FR8, FR9)
// @route POST /api/ai/extract
exports.extractAndMatch = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a text description to extract'
      });
    }

    const extracted = extractAttributesFromText(text);

    // If not enough information was provided (SRS Section 5.2)
    if (!extracted.item && !extracted.location) {
      return res.status(200).json({
        success: true,
        message: "I couldn't identify enough information. Could you tell me what item you lost and where you lost it?",
        data: {
          extracted,
          needsMoreInfo: true,
          matches: []
        }
      });
    }

    let matches = [];

    if (getIsConnectedToMongo()) {
      // Find active/matched found items
      const foundItems = await Item.find({
        type: 'found',
        status: { $in: ['active', 'matched'] }
      }).populate('reportedBy', 'name email organization');

      matches = foundItems
        .map((item) => {
          const { score, breakdown } = calculateMatchScore(extracted, item);
          return {
            item,
            matchScore: score,
            breakdown
          };
        })
        .filter((m) => m.matchScore >= 20)
        .sort((a, b) => b.matchScore - a.matchScore);
    } else {
      matches = memoryStore.findMatchesForQuery(extracted);
    }

    return res.status(200).json({
      success: true,
      message: matches.length > 0
        ? `Found ${matches.length} possible matching item(s) in the database.`
        : 'Attributes extracted, but no matching found records were detected yet.',
      data: {
        extracted,
        needsMoreInfo: false,
        matches: matches.slice(0, 5) // return top 5
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Conversational AI Chatbot endpoint (FR6)
// @route POST /api/ai/chat
exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message string'
      });
    }

    // Save user message if user is logged in
    if (userId) {
      if (getIsConnectedToMongo()) {
        await ChatMessage.create({
          userId,
          role: 'user',
          message
        });
      } else {
        memoryStore.saveChatMessage({
          userId,
          role: 'user',
          message
        });
      }
    }

    const extracted = extractAttributesFromText(message);
    let replyText = '';
    let matches = [];

    if (!extracted.item && !extracted.location) {
      replyText = "Hello! I am your LostLink AI Assistant. You can describe any item you have misplaced in natural language (for example: 'I lost my black wallet near the college library yesterday'). How can I help you today?";
    } else {
      // Run matching engine
      if (getIsConnectedToMongo()) {
        const foundItems = await Item.find({
          type: 'found',
          status: { $in: ['active', 'matched'] }
        }).populate('reportedBy', 'name email organization');

        matches = foundItems
          .map((item) => {
            const { score, breakdown } = calculateMatchScore(extracted, item);
            return {
              item,
              matchScore: score,
              breakdown
            };
          })
          .filter((m) => m.matchScore >= 25)
          .sort((a, b) => b.matchScore - a.matchScore);
      } else {
        matches = memoryStore.findMatchesForQuery(extracted);
      }

      if (matches.length > 0) {
        const topMatch = matches[0];
        replyText = `I analyzed your report: Identified ${extracted.color ? extracted.color + ' ' : ''}${extracted.item || 'item'} at ${extracted.location || 'campus'}. I discovered ${matches.length} possible matching item(s) in our system! The highest match has a confidence score of ${topMatch.matchScore}%. You can review the details below and submit an ownership claim.`;
      } else {
        replyText = `I have extracted your lost item parameters (${extracted.item ? 'Item: ' + extracted.item : ''}${extracted.color ? ', Color: ' + extracted.color : ''}${extracted.location ? ', Location: ' + extracted.location : ''}). However, no matching found records are in the system right now. Would you like to file an official Lost Item Report so others are notified?`;
      }
    }

    // Save assistant message
    if (userId) {
      if (getIsConnectedToMongo()) {
        await ChatMessage.create({
          userId,
          role: 'assistant',
          message: replyText,
          extractedData: extracted
        });
      } else {
        memoryStore.saveChatMessage({
          userId,
          role: 'assistant',
          message: replyText,
          extractedData: extracted
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: replyText,
        extracted,
        matches: matches.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get chat history for current user
// @route GET /api/ai/chat/history
exports.getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    if (getIsConnectedToMongo()) {
      const history = await ChatMessage.find({ userId }).sort({ createdAt: 1 });
      return res.status(200).json({
        success: true,
        data: history
      });
    } else {
      const history = memoryStore.getChatHistory(userId);
      return res.status(200).json({
        success: true,
        data: history
      });
    }
  } catch (error) {
    next(error);
  }
};
