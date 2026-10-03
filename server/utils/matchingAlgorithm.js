/**
 * LostLink AI - Weighted Item Matching Engine
 * Exactly adheres to SRS Section 3.8 & HLD Section 5.3:
 * Matching Attribute Weights:
 * - Item / Category: 30% (0.30)
 * - Color: 20% (0.20)
 * - Location: 25% (0.25)
 * - Date: 15% (0.15)
 * - Description: 10% (0.10)
 * Total: 100%
 * Score Formula: Score = 0.30*I + 0.20*C + 0.25*L + 0.15*D + 0.10*S
 */

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function calculateTokenSimilarity(strA, strB) {
  if (!strA || !strB) return 0;
  const tokensA = new Set(tokenize(strA));
  const tokensB = new Set(tokenize(strB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersectionCount = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersectionCount++;
  });

  const unionCount = new Set([...tokensA, ...tokensB]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function calculateStringContainment(needle, haystack) {
  if (!needle || !haystack) return 0;
  const n = String(needle).toLowerCase().trim();
  const h = String(haystack).toLowerCase().trim();
  if (h === n) return 1.0;
  if (h.includes(n) || n.includes(h)) return 0.85;

  // Check token intersection
  const nTokens = tokenize(n);
  const hTokens = new Set(tokenize(h));
  let match = 0;
  nTokens.forEach((tok) => {
    if (hTokens.has(tok)) match++;
  });

  return nTokens.length > 0 ? match / nTokens.length : 0;
}

function calculateDateSimilarity(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) return 0.5; // neutral if missing
  try {
    const dA = new Date(dateStrA);
    const dB = new Date(dateStrB);
    if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return 0.5;

    const diffDays = Math.abs((dA - dB) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 1.0;
    if (diffDays <= 3) return 0.85;
    if (diffDays <= 7) return 0.65;
    if (diffDays <= 14) return 0.40;
    if (diffDays <= 30) return 0.20;
    return 0.10;
  } catch (err) {
    return 0.5;
  }
}

/**
 * Calculates weighted match score between query criteria and a candidate item.
 * @param {Object} query - Extracted or user search criteria { item, category, color, location, date, description }
 * @param {Object} candidate - Stored item from database
 * @returns {Object} { score: number, breakdown: Object, isMatch: boolean }
 */
function calculateMatchScore(query, candidate) {
  // 1. Item / Category Similarity (Weight: 30%)
  const itemTitleSim = Math.max(
    calculateStringContainment(query.item || query.title, candidate.title),
    calculateTokenSimilarity(query.item || query.title, candidate.title)
  );
  const categorySim = Math.max(
    calculateStringContainment(query.category, candidate.category),
    calculateStringContainment(query.item, candidate.category)
  );
  const itemCategoryScore = Math.max(itemTitleSim, categorySim);

  // 2. Color Similarity (Weight: 20%)
  const colorScore = query.color
    ? calculateStringContainment(query.color, candidate.color)
    : 0.5;

  // 3. Location Similarity (Weight: 25%)
  const locationScore = query.location
    ? Math.max(
        calculateStringContainment(query.location, candidate.location),
        calculateTokenSimilarity(query.location, candidate.location)
      )
    : 0.5;

  // 4. Date Similarity (Weight: 15%)
  const dateScore = query.date
    ? calculateDateSimilarity(query.date, candidate.date)
    : 0.7;

  // 5. Description Similarity (Weight: 10%)
  const descScore = query.description
    ? Math.max(
        calculateTokenSimilarity(query.description, candidate.description),
        calculateStringContainment(query.description, candidate.description)
      )
    : 0.5;

  // SRS formula: 0.30*I + 0.20*C + 0.25*L + 0.15*D + 0.10*S
  const rawScore =
    0.30 * itemCategoryScore +
    0.20 * colorScore +
    0.25 * locationScore +
    0.15 * dateScore +
    0.10 * descScore;

  const percentage = Math.min(100, Math.max(0, Math.round(rawScore * 100)));

  return {
    score: percentage,
    breakdown: {
      itemCategory: Math.round(itemCategoryScore * 100),
      color: Math.round(colorScore * 100),
      location: Math.round(locationScore * 100),
      date: Math.round(dateScore * 100),
      description: Math.round(descScore * 100)
    }
  };
}

module.exports = {
  calculateMatchScore,
  tokenize
};
