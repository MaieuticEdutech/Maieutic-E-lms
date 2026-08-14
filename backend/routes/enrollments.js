// backend/routes/enrollments.js
// Links students to courses (many-to-many).
//
// Setup: in server.js add
//     const enrollmentRoutes = require('./routes/enrollments');
//     app.use('/api', enrollmentRoutes);
//
// Routes (mounted at /api):
//   POST   /enrollments                     { student_id, course_id }   enroll
//   DELETE /enrollments                     { student_id, course_id }   unenroll
//   PUT    /enrollments/:id                 { progress?, status? }      update progress/status
//   GET    /enrollments                     all enrollments (joined)
//   GET    /students/:studentId/courses     courses a student is in
//   GET    /courses/:courseId/students      students in a course

const express = require('express');
const pool = require('../db');

const router = express.Router();

const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id          SERIAL PRIMARY KEY,
      student_id  INTEGER NOT NULL,
      course_id   INTEGER NOT NULL,
      progress    INTEGER NOT NULL DEFAULT 0,
      status      VARCHAR(20) NOT NULL DEFAULT 'Active',
      enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
      UNIQUE (student_id, course_id)
    )
  `)
  .catch((e) => console.error('Failed to create enrollments table:', e.message));

// POST /api/enrollments  { student_id, course_id }
router.post('/enrollments', async (req, res) => {
  try {
    await ready;
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ message: 'student_id and course_id are required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)
       ON CONFLICT (student_id, course_id) DO NOTHING RETURNING *`,
      [student_id, course_id]
    );
    res.status(201).json({ message: rows.length ? 'Enrolled' : 'Already enrolled', enrollment: rows[0] || null });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ message: 'Server error while enrolling' });
  }
});

// DELETE /api/enrollments  { student_id, course_id }
router.delete('/enrollments', async (req, res) => {
  try {
    await ready;
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ message: 'student_id and course_id are required' });
    }
    await pool.query('DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2', [student_id, course_id]);
    res.json({ message: 'Unenrolled' });
  } catch (err) {
    console.error('Unenroll error:', err);
    res.status(500).json({ message: 'Server error while unenrolling' });
  }
});

// PUT /api/enrollments/:id  { progress?, status? }
router.put('/enrollments/:id', async (req, res) => {
  try {
    await ready;
    const cur = await pool.query('SELECT * FROM enrollments WHERE id = $1', [req.params.id]);
    if (cur.rows.length === 0) return res.status(404).json({ message: 'Enrollment not found' });
    const e = cur.rows[0];
    const progress = req.body.progress !== undefined ? Number(req.body.progress) : e.progress;
    const status = req.body.status !== undefined ? req.body.status : e.status;
    const { rows } = await pool.query(
      'UPDATE enrollments SET progress = $1, status = $2 WHERE id = $3 RETURNING *',
      [progress, status, req.params.id]
    );
    res.json({ message: 'Enrollment updated', enrollment: rows[0] });
  } catch (err) {
    console.error('Update enrollment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/enrollments  — all, joined with student + course names
router.get('/enrollments', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(`
      SELECT e.id, e.student_id, e.course_id, e.progress, e.status, e.enrolled_at,
             s.name AS student_name, s.email AS student_email, c.title AS course_title
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN courses  c ON c.id = e.course_id
      ORDER BY e.enrolled_at DESC
    `);
    res.json({ enrollments: rows });
  } catch (err) {
    console.error('List enrollments error:', err);
    res.status(500).json({ message: 'Server error while fetching enrollments' });
  }
});

// GET /api/students/:studentId/courses
router.get('/students/:studentId/courses', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(
      `SELECT c.id, c.title, c.instructor, e.progress, e.status, e.enrolled_at
       FROM enrollments e JOIN courses c ON c.id = e.course_id
       WHERE e.student_id = $1 ORDER BY c.title`,
      [req.params.studentId]
    );
    res.json({ courses: rows });
  } catch (err) {
    console.error('Student courses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:courseId/students
router.get('/courses/:courseId/students', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(
      `SELECT s.id, s.name, s.email, e.progress, e.status, e.enrolled_at
       FROM enrollments e JOIN students s ON s.id = e.student_id
       WHERE e.course_id = $1 ORDER BY s.name`,
      [req.params.courseId]
    );
    res.json({ students: rows });
  } catch (err) {
    console.error('Course students error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/courses/:courseId/enroll  { learners: [{name, email, status?}] }
// Powers BOTH course-side flows: bulk upload (array of learners) and add-a-user
// (array with one learner). Creates each student if new (matched by email),
// then enrolls them all in the course.
router.post('/courses/:courseId/enroll', async (req, res) => {
  try {
    await ready;
    const courseId = Number(req.params.courseId);
    const learners = Array.isArray(req.body.learners) ? req.body.learners : [];
    if (!learners.length) return res.status(400).json({ message: 'No learners provided' });

    let enrolled = 0;
    let created = 0;
    let skipped = 0;

    for (const l of learners) {
      const name = (l.name || '').trim();
      const email = (l.email || '').trim();
      if (!name || !email) { skipped++; continue; }
      try {
        // Find or create the student by email.
        let studentId;
        const found = await pool.query('SELECT id FROM students WHERE LOWER(email) = LOWER($1)', [email]);
        if (found.rows.length) {
          studentId = found.rows[0].id;
        } else {
          const ins = await pool.query('INSERT INTO students (name, email) VALUES ($1, $2) RETURNING id', [name, email]);
          studentId = ins.rows[0].id;
          created++;
        }
        // Enroll (skip if already enrolled).
        const en = await pool.query(
          `INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2)
           ON CONFLICT (student_id, course_id) DO NOTHING RETURNING id`,
          [studentId, courseId]
        );
        if (en.rows.length) enrolled++;
        else skipped++; // already enrolled
      } catch {
        skipped++;
      }
    }

    res.json({
      message: `Enrolled ${enrolled} learner(s). New students created: ${created}. Skipped: ${skipped}.`,
      enrolled,
      created,
      skipped,
    });
  } catch (err) {
    console.error('Course enroll error:', err);
    res.status(500).json({ message: 'Server error while enrolling learners' });
  }
});

module.exports = router;
