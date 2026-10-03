const mongoose = require('mongoose');
const { SEED_USERS, SEED_ITEMS, SEED_CLAIMS, SEED_CHATS } = require('../utils/seedData');

let isConnectedToMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || uri.includes('<username>') || uri.includes('localhost:27017')) {
    // If clearly placeholder or local without guarantee, attempt quick connect with short timeout
  }

  try {
    if (!uri) {
      console.log('ℹ️  No MONGO_URI specified. Operating with resilient In-Memory Store.');
      return false;
    }

    console.log('🔄 Attempting MongoDB Atlas / local connection...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000
    });

    isConnectedToMongo = true;
    console.log('✅ Connected to MongoDB successfully.');

    // Seed if empty
    await seedMongoIfEmpty();
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed: ${error.message}`);
    console.log('🚀 Seamlessly falling back to In-Memory Database store with Appendix G Demo Data.');
    isConnectedToMongo = false;
    return false;
  }
};

async function seedMongoIfEmpty() {
  try {
    const User = require('../models/User');
    const Item = require('../models/Item');
    const Claim = require('../models/Claim');
    const ChatMessage = require('../models/ChatMessage');

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding users into MongoDB Atlas...');
      await User.insertMany(SEED_USERS);
    }

    const itemCount = await Item.countDocuments();
    if (itemCount === 0) {
      console.log('🌱 Seeding items into MongoDB Atlas...');
      await Item.insertMany(SEED_ITEMS);
    }

    const claimCount = await Claim.countDocuments();
    if (claimCount === 0) {
      console.log('🌱 Seeding claims into MongoDB Atlas...');
      await Claim.insertMany(SEED_CLAIMS);
    }

    const chatCount = await ChatMessage.countDocuments();
    if (chatCount === 0) {
      console.log('🌱 Seeding chat messages into MongoDB Atlas...');
      await ChatMessage.insertMany(SEED_CHATS);
    }

    console.log('🌱 Database verification & seeding completed successfully.');
  } catch (err) {
    console.error('Error during MongoDB seeding:', err.message);
  }
}

const getIsConnectedToMongo = () => isConnectedToMongo;

module.exports = {
  connectDB,
  getIsConnectedToMongo
};
