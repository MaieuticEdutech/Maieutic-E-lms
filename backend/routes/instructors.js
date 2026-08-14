// backend/routes/instructors.js
// Instructors table + CRUD. Courses = courses they teach (matched by name on
// courses.instructor); Students = total enrolled across those courses.
//
// Setup: in server.js add
//     const instructorRoutes = require('./routes/instructors');
//     app.use('/api/instructors', instructorRoutes);

const express = require('express');
const pool = require('../db');

const router = express.Router();

const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS instructors (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL,
      email      VARCHAR(255) NOT NULL UNIQUE,
      status     VARCHAR(20)  NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP    NOT NULL DEFAULT NOW()
    )
  `)
  .catch((e) => console.error('Failed to create instructors table:', e.message));

// GET /api/instructors  — list with course + student counts
router.get('/', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(`
      SELECT i.id, i.name, i.email, i.status, i.created_at,
        (SELECT COUNT(*) FROM courses c WHERE c.instructor = i.name)::int AS courses,
        (SELECT COUNT(*) FROM enrollments e
           JOIN courses c ON c.id = e.course_id
          WHERE c.instructor = i.name)::int AS students
      FROM instructors i
      ORDER BY i.name ASC
    `);
    res.json({ instructors: rows });
  } catch (err) {
    // courses/enrollments tables might be missing — fall back to plain list.
    try {
      const { rows } = await pool.query(
        'SELECT id, name, email, status, created_at, 0 AS courses, 0 AS students FROM instructors ORDER BY name ASC'
      );
      return res.json({ instructors: rows });
    } catch (e2) {
      console.error('List instructors error:', err);
      res.status(500).json({ message: 'Server error while fetching instructors' });
    }
  }
});

// GET /api/instructors/:id
router.get('/:id', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query('SELECT * FROM instructors WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Instructor not found' });
    res.json({ instructor: rows[0] });
  } catch (err) {
    console.error('Get instructor error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/instructors
router.post('/', async (req, res) => {
  try {
    await ready;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const dup = await pool.query('SELECT 1 FROM instructors WHERE LOWER(email) = LOWER($1)', [email]);
    if (dup.rows.length) return res.status(409).json({ message: 'An instructor with that email already exists' });

    const { rows } = await pool.query(
      'INSERT INTO instructors (name, email, status) VALUES ($1, $2, $3) RETURNING *',
      [name, email, status]
    );
    res.status(201).json({ message: 'Instructor added', instructor: rows[0] });
  } catch (err) {
    console.error('Create instructor error:', err);
    res.status(500).json({ message: 'Server error while adding the instructor' });
  }
});

// PUT /api/instructors/:id
router.put('/:id', async (req, res) => {
  try {
    await ready;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim();
    const status = req.body.status === 'Inactive' ? 'Inactive' : 'Active';
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const dup = await pool.query('SELECT 1 FROM instructors WHERE LOWER(email) = LOWER($1) AND id <> $2', [email, req.params.id]);
    if (dup.rows.length) return res.status(409).json({ message: 'Another instructor already uses that email' });

    const { rows } = await pool.query(
      'UPDATE instructors SET name = $1, email = $2, status = $3 WHERE id = $4 RETURNING *',
      [name, email, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Instructor not found' });
    res.json({ message: 'Instructor updated', instructor: rows[0] });
  } catch (err) {
    console.error('Update instructor error:', err);
    res.status(500).json({ message: 'Server error while updating the instructor' });
  }
});

// DELETE /api/instructors/:id
router.delete('/:id', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query('DELETE FROM instructors WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Instructor not found' });
    res.json({ message: 'Instructor deleted' });
  } catch (err) {
    console.error('Delete instructor error:', err);
    res.status(500).json({ message: 'Server error while deleting the instructor' });
  }
});

module.exports = router;
