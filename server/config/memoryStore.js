const { SEED_USERS, SEED_ITEMS, SEED_CLAIMS, SEED_CHATS } = require('../utils/seedData');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

/**
 * In-Memory Fallback Database
 * Guarantees 100% demo resilience if MongoDB Atlas is not yet configured or offline.
 */
class MemoryDatabase {
  constructor() {
    this.users = JSON.parse(JSON.stringify(SEED_USERS));
    this.items = JSON.parse(JSON.stringify(SEED_ITEMS));
    this.claims = JSON.parse(JSON.stringify(SEED_CLAIMS));
    this.chats = JSON.parse(JSON.stringify(SEED_CHATS));
  }

  // --- Users ---
  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find((u) => String(u._id) === String(id));
  }

  createUser(userData) {
    const newUser = {
      _id: 'usr_' + Date.now() + Math.random().toString(36).substr(2, 4),
      role: 'user',
      createdAt: new Date(),
      ...userData
    };
    this.users.push(newUser);
    return newUser;
  }

  getAllUsers() {
    return this.users.map(({ password, ...u }) => u);
  }

  updateUser(id, updateData) {
    const idx = this.users.findIndex((u) => String(u._id) === String(id));
    if (idx === -1) return null;
    this.users[idx] = { ...this.users[idx], ...updateData };
    const { password, ...safeUser } = this.users[idx];
    return safeUser;
  }

  // --- Items ---
  getItems(filter = {}) {
    let result = [...this.items];
    if (filter.type) {
      result = result.filter((i) => i.type === filter.type);
    }
    if (filter.category) {
      result = result.filter(
        (i) => i.category.toLowerCase() === filter.category.toLowerCase()
      );
    }
    if (filter.color) {
      result = result.filter((i) =>
        i.color.toLowerCase().includes(filter.color.toLowerCase())
      );
    }
    if (filter.location) {
      result = result.filter((i) =>
        i.location.toLowerCase().includes(filter.location.toLowerCase())
      );
    }
    if (filter.status) {
      result = result.filter((i) => i.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      );
    }
    if (filter.reportedBy) {
      result = result.filter((i) => String(i.reportedBy) === String(filter.reportedBy));
    }
    // populate reporter
    return result.map((item) => {
      const reporter = this.findUserById(item.reportedBy);
      return {
        ...item,
        reportedBy: reporter
          ? { _id: reporter._id, name: reporter.name, email: reporter.email, organization: reporter.organization }
          : item.reportedBy
      };
    });
  }

  getItemById(id) {
    const item = this.items.find((i) => String(i._id) === String(id));
    if (!item) return null;
    const reporter = this.findUserById(item.reportedBy);
    return {
      ...item,
      reportedBy: reporter
        ? { _id: reporter._id, name: reporter.name, email: reporter.email, phone: reporter.phone, organization: reporter.organization }
        : item.reportedBy
    };
  }

  createItem(itemData) {
    const newItem = {
      _id: 'itm_' + Date.now() + Math.random().toString(36).substr(2, 4),
      status: 'active',
      createdAt: new Date(),
      ...itemData
    };
    this.items.unshift(newItem);
    return this.getItemById(newItem._id);
  }

  updateItem(id, updateData) {
    const idx = this.items.findIndex((i) => String(i._id) === String(id));
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...updateData };
    return this.getItemById(id);
  }

  deleteItem(id) {
    const idx = this.items.findIndex((i) => String(i._id) === String(id));
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    // Also remove related claims
    this.claims = this.claims.filter((c) => String(c.itemId) !== String(id));
    return true;
  }

  // --- Claims ---
  createClaim(claimData) {
    const newClaim = {
      _id: 'clm_' + Date.now() + Math.random().toString(36).substr(2, 4),
      status: 'pending',
      adminNotes: '',
      createdAt: new Date(),
      ...claimData
    };
    this.claims.unshift(newClaim);
    return this.populateClaim(newClaim);
  }

  populateClaim(claim) {
    const item = this.getItemById(claim.itemId);
    const claimant = this.findUserById(claim.claimantId);
    return {
      ...claim,
      itemId: item || claim.itemId,
      claimantId: claimant
        ? { _id: claimant._id, name: claimant.name, email: claimant.email, phone: claimant.phone, organization: claimant.organization }
        : claim.claimantId
    };
  }

  getClaimsByUser(userId) {
    return this.claims
      .filter((c) => String(c.claimantId) === String(userId))
      .map((c) => this.populateClaim(c));
  }

  getAllClaims() {
    return this.claims.map((c) => this.populateClaim(c));
  }

  getClaimById(id) {
    const c = this.claims.find((claim) => String(claim._id) === String(id));
    return c ? this.populateClaim(c) : null;
  }

  updateClaim(id, updateData) {
    const idx = this.claims.findIndex((c) => String(c._id) === String(id));
    if (idx === -1) return null;
    this.claims[idx] = { ...this.claims[idx], ...updateData };

    // If claim approved, mark item as claimed/matched as per SRS
    if (updateData.status === 'approved') {
      const itmIdx = this.items.findIndex((i) => String(i._id) === String(this.claims[idx].itemId));
      if (itmIdx !== -1) {
        this.items[itmIdx].status = 'claimed';
      }
    }
    return this.populateClaim(this.claims[idx]);
  }

  // --- Chat Messages ---
  saveChatMessage(chatData) {
    const newChat = {
      _id: 'cht_' + Date.now() + Math.random().toString(36).substr(2, 4),
      createdAt: new Date(),
      ...chatData
    };
    this.chats.push(newChat);
    return newChat;
  }

  getChatHistory(userId) {
    return this.chats.filter((c) => String(c.userId) === String(userId));
  }

  // --- AI Matching & Search ---
  findMatchesForQuery(criteria) {
    // Only search active found items for lost criteria as per SRS Section 3.8
    const foundItems = this.items.filter(
      (item) => item.type === 'found' && (item.status === 'active' || item.status === 'matched')
    );

    const matches = foundItems
      .map((item) => {
        const { score, breakdown } = calculateMatchScore(criteria, item);
        return {
          item: this.getItemById(item._id),
          matchScore: score,
          breakdown
        };
      })
      .filter((m) => m.matchScore > 20) // filter noise
      .sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  getStats() {
    const totalUsers = this.users.length;
    const totalLost = this.items.filter((i) => i.type === 'lost').length;
    const totalFound = this.items.filter((i) => i.type === 'found').length;
    const activeItems = this.items.filter((i) => i.status === 'active').length;
    const resolvedItems = this.items.filter((i) => i.status === 'claimed' || i.status === 'closed').length;
    const totalClaims = this.claims.length;
    const pendingClaims = this.claims.filter((c) => c.status === 'pending').length;
    const approvedClaims = this.claims.filter((c) => c.status === 'approved').length;

    return {
      totalUsers,
      totalLost,
      totalFound,
      activeItems,
      resolvedItems,
      totalClaims,
      pendingClaims,
      approvedClaims
    };
  }
}

const memoryStore = new MemoryDatabase();

module.exports = memoryStore;
