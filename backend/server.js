require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');
const socketServer = require('./sockets/socketServer');

// Routes
const authRoutes = require('./routes/authRoutes');
const sportRoutes = require('./routes/sportRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const returnRoutes = require('./routes/returnRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

const corsOriginHandler = (origin, callback) => {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!origin) return callback(null, true);
  
  // Allow localhost on any port for development
  if (origin.startsWith('http://localhost:')) return callback(null, true);
  
  // Allow explicitly defined production URL
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
  
  return callback(new Error('Not allowed by CORS'));
};

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

socketServer(io);
app.set('io', io);

// Connect DB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: corsOriginHandler,
  credentials: true
}));

// Rate limiting — relaxed in development to avoid blocking dev workflows
const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  skip: () => isDev,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 50,  // Stricter limit for login/register
  skip: () => isDev,
  message: { success: false, message: 'Too many auth attempts. Please wait 15 minutes.' }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300, // Generous limit for token refresh
  skip: () => isDev,
  message: { success: false, message: 'Too many refresh requests. Please wait 15 minutes.' }
});

app.use('/api/', limiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/auth/', authLimiter);

// OTP-specific rate limiter (stricter, but still relaxed in dev)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isDev ? 500 : 10,
  skip: () => isDev,
  message: { success: false, message: 'Too many OTP requests. Try again in 5 minutes.' }
});
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/resend-otp', otpLimiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'U-SPORT API is running 🚀', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

// Overdue return checker (runs every 1 hour)
const checkOverdueReturns = async () => {
  try {
    const EquipmentRequest = require('./models/EquipmentRequest');
    const result = await EquipmentRequest.updateMany(
      {
        status: { $in: ['approved', 'issued', 'partially_returned'] },
        expectedReturnDate: { $lt: new Date() }
      },
      {
        $set: { status: 'overdue' }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Overdue System] Marked ${result.modifiedCount} requests as overdue.`);
    }
  } catch (error) {
    console.error('[Overdue System Error]', error);
  }
};

// Facility auto-release daemon (runs every 1 minute)
const autoReleaseFacilities = async () => {
  try {
    const FacilityRequest = require('./models/FacilityRequest');
    const Sport = require('./models/Sport');
    
    // Find active/approved facility bookings that have expired
    const expired = await FacilityRequest.find({
      status: { $in: ['approved', 'active'] },
      endTime: { $lt: new Date() }
    });

    for (const req of expired) {
      req.status = 'completed';
      req.releasedAt = new Date();
      await req.save();

      const sport = await Sport.findById(req.sportId);
      if (sport) {
        sport.usedFacilities = Math.max(0, sport.usedFacilities - 1);
        await sport.save();
      }
      
      // Emit socket notification
      const ioInstance = app.get('io');
      if (ioInstance) {
        ioInstance.emit('facility_auto_released', { requestId: req._id, sportId: req.sportId });
      }
    }
    
    if (expired.length > 0) {
      console.log(`[Auto-Release System] Automatically released ${expired.length} expired facility sessions.`);
    }
  } catch (err) {
    console.error('[Auto Release Error]', err);
  }
};

// Start periodic jobs
setTimeout(() => {
  checkOverdueReturns();
  autoReleaseFacilities();
  setInterval(checkOverdueReturns, 60 * 60 * 1000);
  setInterval(autoReleaseFacilities, 60 * 1000);
}, 10000);

// 404
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 U-SPORT Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO initialized`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
