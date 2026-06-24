import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import lostFoundRoutes from './routes/lostFoundRoutes.js';
import examRoutes from './routes/examRoutes.js';
import proctorRoutes from './routes/proctorRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import studentManagementRoutes from './routes/studentManagementRoutes.js';
import { connectDB } from './config/database.js';

dotenv.config();

// Verify critical environment configurations on startup
if (!process.env.MONGODB_URI) {
  console.error('CRITICAL STARTUP ERROR: MONGODB_URI is not defined in the environment variables!');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL STARTUP ERROR: JWT_SECRET is not defined in the environment variables!');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://collage-managment-system.vercel.app',
  'https://collage-managment-system-fqny8pad8-addi4109s-projects.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow mobile apps / curl / server-to-server
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked by CORS:", origin);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize MongoDB Atlas connection
connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/lostfound', lostFoundRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/proctor', proctorRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/students', studentManagementRoutes);

// Health check endpoint displaying connection state and process uptime
app.get('/', (req, res) => {
  res.send('API is running');
});

app.get('/health', (req, res) => {
  const dbConnectionStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    status: 'healthy',
    database: dbConnectionStates[mongoose.connection.readyState] || 'unknown',
    uptime: `${process.uptime().toFixed(1)}s`,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server is running in [${NODE_ENV}] mode`);
  const serverUrl = NODE_ENV === 'production'
    ? 'https://collage-managment-system.onrender.com'
    : `http://localhost:${PORT}`;
  console.log(`Server listening on ${serverUrl}`);
});

