// backend/routes/students.js
// Students table + CRUD + bulk CSV import.
//
// Setup: in server.js add
//     const studentRoutes = require('./routes/students');
//     app.use('/api/students', studentRoutes);

const express = require('express');
const pool = require('../db');

const router = express.Router();

const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS students (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      status     VARCHAR(20)  NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `)
  .catch((e) => console.error('Failed to create students table:', e.message));

// GET /api/students  — list with course count + average progress (from enrollments)
router.get('/', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.email, s.status, s.created_at,
             COALESCE(e.course_count, 0)  AS courses,
             COALESCE(e.avg_progress, 0)  AS progress
      FROM students s
      LEFT JOIN (
        SELECT student_id, COUNT(*) AS course_count, ROUND(AVG(progress))::int AS avg_progress
        FROM enrollments GROUP BY student_id
      ) e ON e.student_id = s.id
      ORDER BY s.name ASC
    `);
    res.json({ students: rows });
  } catch (err) {
    // enrollments table might not exist on the very first call — fall back to a plain list.
    try {
      const { rows } = await pool.query(
        'SELECT id, name, email, status, created_at, 0 AS courses, 0 AS progress FROM students ORDER BY name ASC'
      );
      return res.json({ students: rows });
    } catch (e2) {
      console.error('List students error:', err);
      res.status(500).json({ message: 'Server error while fetching students' });
    }
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ student: rows[0] });
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/students  — create one
router.post('/', async (req, res) => {
  try {
    await ready;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';

    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const dup = await pool.query('SELECT 1 FROM students WHERE LOWER(email) = LOWER($1)', [email]);
    if (dup.rows.length) return res.status(409).json({ message: 'A student with that email already exists' });

    const { rows } = await pool.query(
      'INSERT INTO students (name, email, status) VALUES ($1, $2, $3) RETURNING *',
      [name, email, status]
    );
    res.status(201).json({ message: 'Student added', student: rows[0] });
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Server error while adding the student' });
  }
});

// POST /api/students/bulk  — import many. Body: { students: [{name, email, status?}] }
router.post('/bulk', async (req, res) => {
  try {
    await ready;
    const list = Array.isArray(req.body.students) ? req.body.students : [];
    if (!list.length) return res.status(400).json({ message: 'No students provided' });

    let inserted = 0;
    let skipped = 0;
    for (const s of list) {
      const name = (s.name || '').trim();
      const email = (s.email || '').trim();
      const status = s.status === 'Inactive' ? 'Inactive' : 'Active';
      if (!name || !email) { skipped++; continue; }
      try {
        const r = await pool.query(
          `INSERT INTO students (name, email, status) VALUES ($1, $2, $3)
           ON CONFLICT (email) DO NOTHING RETURNING id`,
          [name, email, status]
        );
        if (r.rows.length) inserted++;
        else skipped++; // duplicate email
      } catch {
        skipped++;
      }
    }
    res.json({ message: `Imported ${inserted}, skipped ${skipped}`, inserted, skipped });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

// PUT /api/students/:id
router.put('/:id', async (req, res) => {
  try {
    await ready;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const dup = await pool.query('SELECT 1 FROM students WHERE LOWER(email) = LOWER($1) AND id <> $2', [email, req.params.id]);
    if (dup.rows.length) return res.status(409).json({ message: 'Another student already uses that email' });

    const { rows } = await pool.query(
      'UPDATE students SET name = $1, email = $2, status = $3 WHERE id = $4 RETURNING *',
      [name, email, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student updated', student: rows[0] });
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: 'Server error while updating the student' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', async (req, res) => {
  try {
    await ready;
    // Remove their enrollments too (ignore error if that table doesn't exist yet).
    await pool.query('DELETE FROM enrollments WHERE student_id = $1', [req.params.id]).catch(() => {});
    const { rows } = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Server error while deleting the student' });
  }
});

module.exports = router;
