/**
 * LostLink AI - Client-side AI Service
 * Rule-based Mock AI engine strictly fulfilling SRS Section 3.6, 3.7, 3.8, 3.9 & Appendix E/F.
 * No external API key required. Uses simulated 800ms latency for realistic AI experience.
 */

const delay = (ms = 800) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extracts structured attributes from natural language query
 * Exactly matches SRS FR7 & Appendix F:
 * Example: "I lost my black wallet near the college library yesterday."
 * Returns: { item, category, color, location, date, description }
 */
export const extractLostItemInfo = async (text) => {
  await delay(800);

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

  // Color detection
  const colors = [
    'black', 'blue', 'red', 'white', 'silver', 'grey', 'gray', 'green',
    'yellow', 'brown', 'pink', 'purple', 'orange', 'gold'
  ];
  let extractedColor = null;
  for (const c of colors) {
    if (new RegExp(`\\b${c}\\b`).test(lower)) {
      extractedColor = c;
      break;
    }
  }

  // Category and Item Keywords
  const catalog = [
    { item: 'Wallet', category: 'Personal Accessories', matches: ['wallet', 'purse', 'billfold'] },
    { item: 'Water Bottle', category: 'Personal Accessories', matches: ['water bottle', 'bottle', 'flask', 'tumbler', 'sipper'] },
    { item: 'Backpack', category: 'Bags', matches: ['backpack', 'bag', 'rucksack', 'knapsack'] },
    { item: 'ID Card', category: 'Documents/IDs', matches: ['id card', 'student id', 'identity card', 'badge', 'id'] },
    { item: 'AirPods', category: 'Electronics', matches: ['airpods', 'earbuds', 'headphones', 'earphones'] },
    { item: 'Scientific Calculator', category: 'Electronics', matches: ['calculator', 'scientific calculator', 'casio'] },
    { item: 'Laptop', category: 'Electronics', matches: ['laptop', 'macbook', 'notebook', 'pc'] },
    { item: 'Phone', category: 'Electronics', matches: ['phone', 'iphone', 'smartphone', 'mobile', 'samsung'] },
    { item: 'Keys', category: 'Personal Accessories', matches: ['keys', 'keychain', 'car key'] },
    { item: 'Jacket', category: 'Clothing', matches: ['jacket', 'hoodie', 'sweater', 'coat'] }
  ];

  let extractedItem = null;
  let extractedCategory = null;

  for (const entry of catalog) {
    for (const m of entry.matches) {
      if (lower.includes(m)) {
        extractedItem = entry.item;
        extractedCategory = entry.category;
        break;
      }
    }
    if (extractedItem) break;
  }

  // Campus Locations
  const locations = [
    { name: 'College Library', triggers: ['library', 'college library', 'reading room'] },
    { name: 'Block B', triggers: ['block b', 'b block'] },
    { name: 'Block A', triggers: ['block a', 'a block'] },
    { name: 'Canteen', triggers: ['canteen', 'cafeteria', 'mess', 'food court'] },
    { name: 'Computer Lab', triggers: ['computer lab', 'lab', 'pc lab', 'it lab'] },
    { name: 'Seminar Hall 3', triggers: ['seminar hall', 'seminar hall 3', 'auditorium'] },
    { name: 'Sports Complex', triggers: ['sports complex', 'gym', 'ground', 'court'] }
  ];

  let extractedLocation = null;
  for (const loc of locations) {
    for (const t of loc.triggers) {
      if (lower.includes(t)) {
        extractedLocation = loc.name;
        break;
      }
    }
    if (extractedLocation) break;
  }

  // Date Parsing
  let extractedDate = null;
  if (lower.includes('yesterday')) {
    extractedDate = '2026-09-28';
  } else if (lower.includes('today')) {
    extractedDate = '2026-09-29';
  } else {
    const explicitDate = text.match(/\b(202[0-9]-[0-1][0-9]-[0-3][0-9])\b/);
    extractedDate = explicitDate ? explicitDate[0] : '2026-09-28';
  }

  let extractedDescription = null;
  if (extractedItem) {
    extractedDescription = `${extractedColor ? extractedColor + ' ' : ''}${extractedItem.toLowerCase()}${extractedLocation ? ' near ' + extractedLocation : ''}`;
  }

  return {
    item: extractedItem,
    category: extractedCategory,
    color: extractedColor,
    location: extractedLocation,
    date: extractedDate,
    description: extractedDescription
  };
};

/**
 * Weighted Matching Algorithm as specified in SRS 3.8 & HLD 5.3:
 * Score = 0.30*I + 0.20*C + 0.25*L + 0.15*D + 0.10*S
 */
export const calculateMatchScore = (query, item) => {
  if (!query || !item) return { score: 0, breakdown: {} };

  const qItem = (query.item || query.title || '').toLowerCase();
  const iTitle = (item.title || '').toLowerCase();
  const qCat = (query.category || '').toLowerCase();
  const iCat = (item.category || '').toLowerCase();

  // 1. Item / Category (30%)
  let itemCategoryScore = 0;
  if (qItem && iTitle.includes(qItem)) itemCategoryScore = 1.0;
  else if (qCat && iCat.includes(qCat)) itemCategoryScore = 0.85;
  else if (qItem && (iTitle.split(' ').some(w => qItem.includes(w)))) itemCategoryScore = 0.6;
  else itemCategoryScore = 0.1;

  // 2. Color (20%)
  let colorScore = 0.3;
  if (query.color && item.color) {
    if (item.color.toLowerCase().includes(query.color.toLowerCase())) {
      colorScore = 1.0;
    } else {
      colorScore = 0.0;
    }
  }

  // 3. Location (25%)
  let locationScore = 0.3;
  if (query.location && item.location) {
    const qLoc = query.location.toLowerCase();
    const iLoc = item.location.toLowerCase();
    if (iLoc.includes(qLoc) || qLoc.includes(iLoc)) {
      locationScore = 1.0;
    } else {
      locationScore = 0.1;
    }
  }

  // 4. Date (15%)
  let dateScore = 0.7;
  if (query.date && item.date) {
    const d1 = new Date(query.date);
    const d2 = new Date(item.date);
    const diffDays = Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) dateScore = 1.0;
    else if (diffDays <= 3) dateScore = 0.85;
    else if (diffDays <= 7) dateScore = 0.5;
    else dateScore = 0.2;
  }

  // 5. Description (10%)
  let descScore = 0.5;
  if (query.description && item.description) {
    const qDescWords = query.description.toLowerCase().split(/\s+/);
    const iDesc = item.description.toLowerCase();
    let hits = 0;
    qDescWords.forEach(w => {
      if (w.length > 2 && iDesc.includes(w)) hits++;
    });
    descScore = Math.min(1.0, hits / Math.max(1, qDescWords.length * 0.5));
  }

  const totalScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (0.30 * itemCategoryScore +
         0.20 * colorScore +
         0.25 * locationScore +
         0.15 * dateScore +
         0.10 * descScore) * 100
      )
    )
  );

  return {
    score: totalScore,
    breakdown: {
      itemCategory: Math.round(itemCategoryScore * 100),
      color: Math.round(colorScore * 100),
      location: Math.round(locationScore * 100),
      date: Math.round(dateScore * 100),
      description: Math.round(descScore * 100)
    }
  };
};

/**
 * Chatbot processor that combines extraction and database matching
 */
export const chatWithAI = async (message, availableFoundItems = []) => {
  await delay(800);

  const extracted = await extractLostItemInfo(message);

  if (!extracted.item && !extracted.location) {
    return {
      reply: "Hello! I am LostLink AI. Please tell me what you have misplaced (for instance: 'I lost my blue water bottle near Block B yesterday'). I will analyze your words, extract key parameters, and search for matching found items across campus.",
      extracted,
      matches: []
    };
  }

  const matches = (availableFoundItems || [])
    .filter(item => item.type === 'found' && (item.status === 'active' || item.status === 'matched'))
    .map(item => {
      const matchCalc = calculateMatchScore(extracted, item);
      return {
        item,
        matchScore: matchCalc.score,
        breakdown: matchCalc.breakdown
      };
    })
    .filter(m => m.matchScore >= 25)
    .sort((a, b) => b.matchScore - a.matchScore);

  let reply = '';
  if (matches.length > 0) {
    const top = matches[0];
    reply = `I processed your description: Extracted [${extracted.color ? extracted.color + ' ' : ''}${extracted.item}] at [${extracted.location || 'campus'}]. I found ${matches.length} matching found item(s) in our database! Top match confidence is ${top.matchScore}%. Review the item details below to verify and claim.`;
  } else {
    reply = `I extracted your criteria (${[extracted.color, extracted.item, extracted.location].filter(Boolean).join(', ')}), but no matching found records were detected in the system yet. You can file a formal Lost Item Report so other students or staff can assist.`;
  }

  return {
    reply,
    extracted,
    matches
  };
};

/**
 * Suggested verification questions based on category
 */
export const generateVerificationQuestions = (category = '') => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('personal') || cat.includes('wallet')) {
    return [
      'What specific cards or documents are inside?',
      'Is there any unique markings or brand engraving?',
      'What approximate cash or denomination was in the wallet?'
    ];
  }
  if (cat.includes('electronics') || cat.includes('phone') || cat.includes('airpod')) {
    return [
      'What is the lock screen wallpaper or device serial ending digits?',
      'What color is the protective case or protective sticker?',
      'What network provider or custom Bluetooth device name is saved?'
    ];
  }
  return [
    'Describe any distinguishing marks, scratches, or stickers.',
    'What brand or manufacturer logo is present?',
    'What was inside or attached to the item when lost?'
  ];
};
