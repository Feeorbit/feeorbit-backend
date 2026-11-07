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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    service: 'GymPulse Management API',
    mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
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

// Database Connection & Server Start
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected (${MONGODB_URI.includes('mongodb+srv') ? 'Atlas Cloud' : 'Local'})`);
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed: ${err.message}`);
    if (process.env.NODE_ENV !== 'production' && MONGODB_URI !== 'mongodb://127.0.0.1:27017/gym_pulse_db') {
      try {
        console.log('🔄 Retrying with local MongoDB fallback...');
        await mongoose.connect('mongodb://127.0.0.1:27017/gym_pulse_db');
        console.log('✅ Connected to local MongoDB fallback successfully.');
      } catch (localErr) {
        console.error('❌ Local MongoDB fallback also failed:', localErr.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FeeOrbit API & Chat Server running on port ${PORT}`);
    console.log(`📍 Health check available at http://localhost:${PORT}/api/health`);
  });
  // Prevent premature socket closing during Gemini AI generation
  server.keepAliveTimeout = 120000;
  server.headersTimeout = 125000;
  server.timeout = 120000;
};

connectDB();

