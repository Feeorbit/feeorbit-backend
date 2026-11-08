const path = require('path');
const dotenv = require('dotenv');

// Priority: Load environment-specific config if present, then fallback to default .env
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: path.resolve(__dirname, '../.env.production') });
}
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const planRoutes = require('./routes/planRoutes');
const memberRoutes = require('./routes/memberRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const gymRoutes = require('./routes/gymRoutes');
const staffRoutes = require('./routes/staffRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const eventRoutes = require('./routes/eventRoutes');

const authRoutes = require('./routes/authRoutes');
const http = require('http');
const { Server } = require('socket.io');
const { initChatSocket } = require('./utils/chatSocket');

const webhookRoutes = require('./routes/webhookRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const productRoutes = require('./routes/productRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const { setupSwagger } = require('./config/swagger');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io real-time chat
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
initChatSocket(io);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db';

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/store', productRoutes);
app.use('/api/payroll', payrollRoutes);

// Interactive OpenAPI & Swagger Documentation
setupSwagger(app);

let lastMongoError = null;
let isConnecting = false;

// Health check endpoint (always responds even if DB is still connecting)
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'FeeOrbit Management API',
    mongoStatus: isConnected ? 'connected' : (isConnecting ? 'connecting' : 'disconnected'),
    databaseName: isConnected ? mongoose.connection.db?.databaseName : null,
    mongoHost: isConnected ? mongoose.connection.host : null,
    mongoError: isConnected ? null : lastMongoError,
  });
});

// Database gate: gracefully inform callers if database is temporarily unavailable instead of crashing
app.use('/api', (req, res, next) => {
  if (
    req.path === '/health' ||
    req.path.startsWith('/docs') ||
    req.path.startsWith('/api-docs') ||
    req.path.startsWith('/webhooks')
  ) {
    return next();
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'FeeOrbit Database is initializing or reconnecting. Please try again in a moment.',
      mongoStatus: isConnecting ? 'connecting' : 'disconnected',
      error: lastMongoError,
    });
  }
  next();
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Automatically resolve and convert MongoDB Atlas srv URIs into resilient standard replica set URIs
// to permanently eliminate the notorious Render/Docker 'querySrv ENOTFOUND' DNS resolution bug
function formatMongoUri(rawUri) {
  if (!rawUri) return rawUri;

  // FeeOrbit cluster (4h6pg2a)
  if (rawUri.includes('4h6pg2a.mongodb.net') && rawUri.startsWith('mongodb+srv://')) {
    const authMatch = rawUri.match(/mongodb\+srv:\/\/([^@]+)@/);
    const auth = authMatch ? authMatch[1] : '';
    const dbMatch = rawUri.match(/4h6pg2a\.mongodb\.net\/([^?]*)/);
    const db = (dbMatch && dbMatch[1] && dbMatch[1].trim()) ? dbMatch[1].trim() : 'feeorbit_db';
    return `mongodb://${auth}@ac-c7nolfp-shard-00-00.4h6pg2a.mongodb.net:27017,ac-c7nolfp-shard-00-01.4h6pg2a.mongodb.net:27017,ac-c7nolfp-shard-00-02.4h6pg2a.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-h4g5zb-shard-0&authSource=admin&retryWrites=true&w=majority`;
  }

  // Digniflow cluster (bqrqg57)
  if (rawUri.includes('bqrqg57.mongodb.net') && rawUri.startsWith('mongodb+srv://')) {
    const authMatch = rawUri.match(/mongodb\+srv:\/\/([^@]+)@/);
    const auth = authMatch ? authMatch[1] : '';
    const dbMatch = rawUri.match(/bqrqg57\.mongodb\.net\/([^?]*)/);
    const db = (dbMatch && dbMatch[1] && dbMatch[1].trim()) ? dbMatch[1].trim() : 'feeorbit_db';
    return `mongodb://${auth}@ac-rlk7dzr-shard-00-00.bqrqg57.mongodb.net:27017,ac-rlk7dzr-shard-00-01.bqrqg57.mongodb.net:27017,ac-rlk7dzr-shard-00-02.bqrqg57.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-tsx2ni-shard-0&authSource=admin&retryWrites=true&w=majority`;
  }

  return rawUri;
}

// Database Connection with Auto-Retry (Never crash the cloud container!)
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  isConnecting = true;
  const targetUri = formatMongoUri(MONGODB_URI);
  try {
    const isCloud = targetUri.includes('mongodb.net');
    console.log(`🔌 Attempting MongoDB connection: ${isCloud ? 'Atlas Cloud' : 'Local'}...`);
    const connectOptions = {
      serverSelectionTimeoutMS: 8000,
    };
    if (isCloud || !targetUri.includes('gym_pulse_db')) {
      connectOptions.dbName = 'feeorbit_db';
    }
    await mongoose.connect(targetUri, connectOptions);
    lastMongoError = null;
    console.log(`✅ MongoDB Connected Successfully (${isCloud ? 'Atlas Cloud [feeorbit_db]' : 'Local'})`);
  } catch (err) {
    lastMongoError = err.message;
    console.warn(`⚠️ Primary MongoDB connection failed: ${err.message}`);

    if (process.env.NODE_ENV !== 'production' && MONGODB_URI !== 'mongodb://127.0.0.1:27017/gym_pulse_db') {
      try {
        console.log('🔄 Retrying with local MongoDB fallback...');
        await mongoose.connect('mongodb://127.0.0.1:27017/gym_pulse_db', {
          serverSelectionTimeoutMS: 3000,
        });
        lastMongoError = null;
        console.log('✅ Connected to local MongoDB fallback successfully.');
        isConnecting = false;
        return;
      } catch (localErr) {
        console.warn('⚠️ Local MongoDB fallback also failed:', localErr.message);
      }
    }

    // On cloud platforms (Render/Railway), keep HTTP server alive and retry in background
    console.log('🔄 Will retry MongoDB connection in 10 seconds (keeping server alive)...');
    setTimeout(() => {
      isConnecting = false;
      connectDB();
    }, 10000);
  } finally {
    isConnecting = false;
  }
};

// Start HTTP Server immediately so Render port binding succeeds instantly
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FeeOrbit API & Chat Server running on port ${PORT}`);
  console.log(`📍 Health check available at http://localhost:${PORT}/api/health`);
  connectDB();
});

// Prevent premature socket closing during Gemini AI generation
server.keepAliveTimeout = 120000;
server.headersTimeout = 125000;
server.timeout = 120000;

