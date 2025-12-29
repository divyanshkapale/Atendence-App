const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();
const connectMongoDB = require('./config/db');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Rate limiting
const uploadLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // limit each user to 1 photo per day
  message: { error: 'You can only upload one photo per day' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Connect to MongoDB
connectMongoDB();

// Connect to MongoDB


// Routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/id-card', require('./routes/idCardRoutes'));

// Serve the main page for all non-api routes (SPA support)
app.get('(.*)', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, async () => {
  console.log(`🚀 E-Attendance Server running on http://localhost:${port}`);
  console.log(`📊 MongoDB database: attendance_db`);
  console.log(`📸 Photos stored in: ${uploadsDir}`);
});
// Server restart trigger 