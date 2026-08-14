// backend/routes/modules.js
// Manages the modules inside a course. Each module has a title plus three
// uploaded files: a PDF, a Video, and an Assessment (stored as URLs).
//
// Setup: in server.js add
//     const moduleRoutes = require('./routes/modules');
//     app.use('/api', moduleRoutes);
//
// Routes (mounted at /api):
//   GET    /courses/:courseId/modules   list a course's modules
//   POST   /courses/:courseId/modules   add a module
//   PUT    /modules/:id                 update a module (title / file URLs / position)
//   DELETE /modules/:id                 delete a module

const express = require('express');
const pool = require('../db');

const router = express.Router();

// Create the table on first use. (No hard FK so load order with courses.js
// never matters; course_id is just an indexed integer.)
const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS modules (
      id             SERIAL PRIMARY KEY,
      course_id      INTEGER NOT NULL,
      title          VARCHAR(255) NOT NULL,
      position       INTEGER NOT NULL DEFAULT 0,
      pdf_url        VARCHAR(500),
      video_url      VARCHAR(500),
      assessment_url VARCHAR(500),
      created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  .then(() => pool.query('CREATE INDEX IF NOT EXISTS idx_modules_course ON modules (course_id)'))
  .catch((e) => console.error('Failed to create modules table:', e.message));

const nn = (v) => (v === undefined || v === null || v === '' ? null : v);

// GET /api/courses/:courseId/modules
router.get('/courses/:courseId/modules', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY position ASC, id ASC',
      [req.params.courseId]
    );
    res.json({ modules: rows });
  } catch (err) {
    console.error('List modules error:', err);
    res.status(500).json({ message: 'Server error while fetching modules' });
  }
});

// POST /api/courses/:courseId/modules
router.post('/courses/:courseId/modules', async (req, res) => {
  try {
    await ready;
    const courseId = Number(req.params.courseId);
    const title = (req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Module title is required' });
    }

    // Put the new module at the end.
    const posRes = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM modules WHERE course_id = $1',
      [courseId]
    );
    const position = posRes.rows[0].next;

    const { rows } = await pool.query(
      `INSERT INTO modules (course_id, title, position, pdf_url, video_url, assessment_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        courseId,
        title,
        position,
        nn(req.body.pdf_url),
        nn(req.body.video_url),
        nn(req.body.assessment_url),
      ]
    );
    res.status(201).json({ message: 'Module added', module: rows[0] });
  } catch (err) {
    console.error('Create module error:', err);
    res.status(500).json({ message: 'Server error while adding the module' });
  }
});

// PUT /api/modules/:id
router.put('/modules/:id', async (req, res) => {
  try {
    await ready;
    // Read the current row so callers can update just one field at a time.
    const current = await pool.query('SELECT * FROM modules WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    const m = current.rows[0];
    const b = req.body;

    const title = b.title !== undefined ? (b.title || '').trim() : m.title;
    if (!title) {
      return res.status(400).json({ message: 'Module title is required' });
    }

    const { rows } = await pool.query(
      `UPDATE modules SET
         title=$1, position=$2, pdf_url=$3, video_url=$4, assessment_url=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING *`,
      [
        title,
        b.position !== undefined ? Number(b.position) : m.position,
        b.pdf_url !== undefined ? nn(b.pdf_url) : m.pdf_url,
        b.video_url !== undefined ? nn(b.video_url) : m.video_url,
        b.assessment_url !== undefined ? nn(b.assessment_url) : m.assessment_url,
        req.params.id,
      ]
    );
    res.json({ message: 'Module updated', module: rows[0] });
  } catch (err) {
    console.error('Update module error:', err);
    res.status(500).json({ message: 'Server error while updating the module' });
  }
});

// DELETE /api/modules/:id
router.delete('/modules/:id', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query('DELETE FROM modules WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    res.json({ message: 'Module deleted' });
  } catch (err) {
    console.error('Delete module error:', err);
    res.status(500).json({ message: 'Server error while deleting the module' });
  }
});

module.exports = router;