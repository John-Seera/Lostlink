require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getIsConnectedToMongo } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/item');
const claimRoutes = require('./routes/claim');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();


// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  const isMongo = getIsConnectedToMongo();
  res.status(200).json({
    success: true,
    service: 'LostLink AI Backend',
    version: '1.0.0',
    status: 'operational',
    database: isMongo ? 'MongoDB Atlas' : 'In-Memory Fallback',
    mongoConnected: isMongo,
    timestamp: new Date().toISOString()
  });
});

// Mount API routes exactly per SRS
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Central Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 LostLink AI Backend Server running on port ${PORT}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 AI Chat & Matching Engine: Active`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use.`);
      process.exit(1);
    } else {
      console.error(`❌ Server error:`, err);
    }
  });
};

startServer();

module.exports = app;
