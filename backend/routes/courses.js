// backend/routes/courses.js
// Full CRUD API for courses, backed by PostgreSQL.
// The list route reports the live enrolled-student count from the enrollments table.

const express = require('express');
const pool = require('../db');

const router = express.Router();

// --- Ensure the table exists (runs once at startup) ---
const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS courses (
      id                SERIAL PRIMARY KEY,
      title             VARCHAR(255) NOT NULL,
      short_description TEXT,
      full_description  TEXT,
      instructor        VARCHAR(255),
      category          VARCHAR(100),
      language          VARCHAR(50),
      price             NUMERIC(10,2) NOT NULL DEFAULT 0,
      visibility        VARCHAR(10)   NOT NULL DEFAULT 'show',
      published         BOOLEAN       NOT NULL DEFAULT true,
      start_date        DATE,
      end_date          DATE,
      image_url         VARCHAR(500),
      students          INTEGER       NOT NULL DEFAULT 0,
      status            VARCHAR(20)   NOT NULL DEFAULT 'Draft',
      created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
      updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
    )
  `)
  .catch((e) => console.error('Failed to create courses table:', e.message));

// Turn "" / undefined into null (so empty dates don't break PostgreSQL).
const nn = (v) => (v === undefined || v === null || v === '' ? null : v);

// Build a normalized course object from a request body.
function normalize(body) {
  const visibility = body.visibility === 'hide' ? 'hide' : 'show';
  const published = body.published != null ? !!body.published : visibility === 'show';
  return {
    title: (body.title || '').trim(),
    short_description: nn(body.short_description),
    full_description: nn(body.full_description),
    instructor: nn(body.instructor),
    category: nn(body.category),
    language: nn(body.language),
    price: body.price === '' || body.price == null ? 0 : Number(body.price),
    visibility,
    published,
    start_date: nn(body.start_date),
    end_date: nn(body.end_date),
    image_url: nn(body.image_url),
    students: body.students != null ? Number(body.students) : 0,
    status: published ? 'Published' : 'Draft',
  };
}

// GET /api/courses  — list all courses, with the LIVE enrolled-student count
router.get('/', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(`
      SELECT c.id, c.title, c.short_description, c.full_description, c.instructor,
             c.category, c.language, c.price, c.visibility, c.published,
             c.start_date, c.end_date, c.image_url, c.status, c.created_at, c.updated_at,
             COALESCE(e.cnt, 0)::int AS students
      FROM courses c
      LEFT JOIN (
        SELECT course_id, COUNT(*) AS cnt FROM enrollments GROUP BY course_id
      ) e ON e.course_id = c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ courses: rows });
  } catch (err) {
    // If the enrollments table isn't there yet, fall back to a plain list.
    try {
      const { rows } = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
      return res.json({ courses: rows });
    } catch (e2) {
      console.error('List courses error:', err);
      res.status(500).json({ message: 'Server error while fetching courses' });
    }
  }
});

// GET /api/courses/:id  — one course
router.get('/:id', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ course: rows[0] });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ message: 'Server error while fetching the course' });
  }
});

// POST /api/courses  — create
router.post('/', async (req, res) => {
  try {
    await ready;
    const c = normalize(req.body);
    if (!c.title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO courses
        (title, short_description, full_description, instructor, category, language,
         price, visibility, published, start_date, end_date, image_url, students, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        c.title, c.short_description, c.full_description, c.instructor, c.category, c.language,
        c.price, c.visibility, c.published, c.start_date, c.end_date, c.image_url, c.students, c.status,
      ]
    );
    res.status(201).json({ message: 'Course created', course: rows[0] });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ message: 'Server error while creating the course' });
  }
});

// PUT /api/courses/:id  — update
router.put('/:id', async (req, res) => {
  try {
    await ready;
    const c = normalize(req.body);
    if (!c.title) {
      return res.status(400).json({ message: 'Course title is required' });
    }

    const { rows } = await pool.query(
      `UPDATE courses SET
         title=$1, short_description=$2, full_description=$3, instructor=$4, category=$5,
         language=$6, price=$7, visibility=$8, published=$9, start_date=$10, end_date=$11,
         image_url=$12, status=$13, updated_at=NOW()
       WHERE id=$14
       RETURNING *`,
      [
        c.title, c.short_description, c.full_description, c.instructor, c.category,
        c.language, c.price, c.visibility, c.published, c.start_date, c.end_date,
        c.image_url, c.status, req.params.id,
      ]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course updated', course: rows[0] });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ message: 'Server error while updating the course' });
  }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req, res) => {
  try {
    await ready;
    // Remove this course's enrollments too (ignore if that table isn't there).
    await pool.query('DELETE FROM enrollments WHERE course_id = $1', [req.params.id]).catch(() => {});
    const { rows } = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ message: 'Server error while deleting the course' });
  }
});

module.exports = router;
