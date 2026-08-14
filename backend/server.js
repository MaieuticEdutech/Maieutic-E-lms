require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

// Route modules
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const uploadRoutes = require('./routes/upload');
const studentRoutes = require('./routes/students');
const enrollmentRoutes = require('./routes/enrollments');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/students', studentRoutes);
app.use('/api', moduleRoutes);      // /api/courses/:id/modules, /api/modules/:id
app.use('/api', enrollmentRoutes);  // /api/enrollments, /api/courses/:id/enroll, /api/courses/:id/students, /api/students/:id/courses
app.use('/api/upload', uploadRoutes);

// Serve uploaded files (images, PDFs, videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'MAIEUTIC LMS Backend is running' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'Backend and PostgreSQL are connected',
      databaseTime: result.rows[0].now
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

app.listen(PORT, () => {
  console.log(`MAIEUTIC LMS Backend running on http://localhost:${PORT}`);
});
