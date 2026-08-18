// Fallback memory store for resilient execution when local MongoDB is unavailable
const memoryDb = new Map();
const usersDb = new Map();

export const memoryStore = {
  // ─── USER METHODS ───
  async createUser(userData) {
    const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newUser = {
      _id: id,
      createdAt: new Date(),
      ...userData
    };
    usersDb.set(id, newUser);
    return newUser;
  },

  async findUserByEmail(email) {
    for (const user of usersDb.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return null;
  },

  async findUserById(id) {
    return usersDb.get(id) || null;
  },

  // ─── URL METHODS ───
  async create(data) {
    const id = 'url_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const newItem = {
      _id: id,
      userId: data.userId || null,
      clicks: 0,
      isActive: true,
      lastClickedAt: null,
      analytics: [],
      createdAt: new Date(),
      expiresAt: null,
      customAlias: null,
      ...data
    };
    memoryDb.set(data.shortCode, newItem);
    if (data.customAlias) {
      memoryDb.set(data.customAlias, newItem);
    }
    return newItem;
  },

  async findOne(query) {
    for (const item of memoryDb.values()) {
      if (query.shortCode && item.shortCode === query.shortCode) return item;
      if (query.customAlias && item.customAlias === query.customAlias) return item;
      if (query._id && item._id === query._id) return item;
    }
    return null;
  },

  async findById(id) {
    for (const item of memoryDb.values()) {
      if (item._id === id) return item;
    }
    return null;
  },

  async find(query = {}) {
    const items = Array.from(new Set(memoryDb.values()));
    let filtered = items;

    if (query.userId !== undefined) {
      filtered = filtered.filter(item => String(item.userId) === String(query.userId));
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async updateClicksAndAnalytics(shortCode, analyticsEntry) {
    let item = null;
    for (const record of memoryDb.values()) {
      if (record.shortCode === shortCode || record.customAlias === shortCode) {
        item = record;
        break;
      }
    }

    if (!item) return null;

    item.clicks += 1;
    item.lastClickedAt = new Date();
    item.analytics.push(analyticsEntry);
    
    memoryDb.set(item.shortCode, item);
    if (item.customAlias) {
      memoryDb.set(item.customAlias, item);
    }
    return item;
  },

  async updateById(id, updateData) {
    const item = await this.findById(id);
    if (!item) return null;

    Object.assign(item, updateData);
    memoryDb.set(item.shortCode, item);
    if (item.customAlias) {
      memoryDb.set(item.customAlias, item);
    }
    return item;
  },

  async deleteById(id) {
    for (const [key, item] of memoryDb.entries()) {
      if (item._id === id) {
        memoryDb.delete(item.shortCode);
        if (item.customAlias) memoryDb.delete(item.customAlias);
        return true;
      }
    }
    return false;
  }
};
