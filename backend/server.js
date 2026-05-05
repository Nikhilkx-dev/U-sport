require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');
const socketServer = require('./sockets/socketServer');

// Routes
const authRoutes = require('./routes/authRoutes');
const sportRoutes = require('./routes/sportRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow localhost on any port for development
      if (origin.startsWith('http://localhost:')) return callback(null, true);
      
      // Allow production URL
      if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
      
      return callback(new Error('Not allowed by CORS'));
    },
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
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port for development
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    
    // Allow production URL
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return callback(null, true);
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'U-SPORT API is running 🚀', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/facility', facilityRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/chat', chatRoutes);

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
