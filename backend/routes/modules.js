// backend/routes/modules.js
// Manages the modules inside a course, and the units (sub-modules) inside each
// module. Both live in the same `modules` table: a row with parent_id = NULL is
// a module, a row with parent_id = <module id> is a unit under that module.
// The tree is two levels deep — a unit cannot itself hold units.
//
// Every row (module or unit) has a title plus three uploaded files: a PDF, a
// Video, and an Assessment (stored as URLs).
//
// Setup: in server.js add
//     const moduleRoutes = require('./routes/modules');
//     app.use('/api', moduleRoutes);
//
// Routes (mounted at /api):
//   GET    /courses/:courseId/modules   list a course's modules, each with its units
//   POST   /courses/:courseId/modules   add a module (pass parent_id to add a unit)
//   POST   /modules/:id/units           add a unit under module :id
//   PUT    /modules/:id                 update a module or unit (title / files / position / parent)
//   DELETE /modules/:id                 delete a module (and its units) or a single unit

const express = require('express');
const pool = require('../db');
// Each module/unit holds a list of activities (see routes/activities.js).
const { activitiesByModule, deleteForModules } = require('./activities');

const router = express.Router();

// Create the table on first use. (No hard FK to courses so load order with
// courses.js never matters; course_id is just an indexed integer.)
// parent_id is self-referencing and nullable: NULL = module, set = unit.
const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS modules (
      id             SERIAL PRIMARY KEY,
      course_id      INTEGER NOT NULL,
      parent_id      INTEGER,
      title          VARCHAR(255) NOT NULL,
      position       INTEGER NOT NULL DEFAULT 0,
      pdf_url        VARCHAR(500),
      video_url      VARCHAR(500),
      assessment_url VARCHAR(500),
      created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  // Installs made before units existed have no parent_id column, so add it.
  .then(() => pool.query('ALTER TABLE modules ADD COLUMN IF NOT EXISTS parent_id INTEGER'))
  .then(() => pool.query('CREATE INDEX IF NOT EXISTS idx_modules_course ON modules (course_id)'))
  .then(() => pool.query('CREATE INDEX IF NOT EXISTS idx_modules_parent ON modules (parent_id)'))
  .catch((e) => console.error('Failed to create modules table:', e.message));

const nn = (v) => (v === undefined || v === null || v === '' ? null : v);

// Normalise an incoming parent_id: "" / null / undefined / 0 all mean top level.
const parentOf = (v) => {
  const n = Number(nn(v));
  return Number.isInteger(n) && n > 0 ? n : null;
};

// A parent must exist, sit in the same course, and be a module itself, which is
// what keeps the tree two levels deep. Returns an error string, or null when OK.
async function checkParent(parentId, courseId) {
  if (parentId === null) return null;
  const { rows } = await pool.query('SELECT course_id, parent_id FROM modules WHERE id = $1', [parentId]);
  if (rows.length === 0) return 'Parent module not found';
  if (Number(rows[0].course_id) !== Number(courseId)) return 'Parent module belongs to a different course';
  if (rows[0].parent_id !== null) return 'A unit cannot contain further units';
  return null;
}

// Next position among a row's siblings (same course, same parent).
async function nextPosition(courseId, parentId) {
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(position), -1) + 1 AS next
       FROM modules
      WHERE course_id = $1 AND parent_id IS NOT DISTINCT FROM $2`,
    [courseId, parentId]
  );
  return rows[0].next;
}

// GET /api/courses/:courseId/modules
// Returns the modules nested: [{ ...module, units: [ ...unit ] }].
// `flat` carries every row unnested, for callers that want the raw list.
router.get('/courses/:courseId/modules', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(
      'SELECT * FROM modules WHERE course_id = $1 ORDER BY position ASC, id ASC',
      [req.params.courseId]
    );

    const byModule = await activitiesByModule(rows.map((r) => r.id));

    const byId = new Map(rows.map((r) => [r.id, { ...r, units: [], activities: byModule.get(r.id) ?? [] }]));
    const modules = [];
    for (const row of rows) {
      const node = byId.get(row.id);
      const parent = row.parent_id !== null ? byId.get(row.parent_id) : null;
      // Orphans (parent deleted out from under them) fall back to top level.
      if (parent) parent.units.push(node);
      else modules.push(node);
    }

    res.json({ modules, flat: rows });
  } catch (err) {
    console.error('List modules error:', err);
    res.status(500).json({ message: 'Server error while fetching modules' });
  }
});

// POST /api/courses/:courseId/modules   { title, parent_id?, pdf_url?, ... }
// Omit parent_id for a module; pass a module id to add a unit under it.
router.post('/courses/:courseId/modules', async (req, res) => {
  try {
    await ready;
    const courseId = Number(req.params.courseId);
    const title = (req.body.title || '').trim();
    const parentId = parentOf(req.body.parent_id);
    const label = parentId ? 'Unit' : 'Module';

    if (!title) {
      return res.status(400).json({ message: `${label} title is required` });
    }

    const parentError = await checkParent(parentId, courseId);
    if (parentError) return res.status(400).json({ message: parentError });

    const position = await nextPosition(courseId, parentId);

    const { rows } = await pool.query(
      `INSERT INTO modules (course_id, parent_id, title, position, pdf_url, video_url, assessment_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        courseId,
        parentId,
        title,
        position,
        nn(req.body.pdf_url),
        nn(req.body.video_url),
        nn(req.body.assessment_url),
      ]
    );
    res.status(201).json({ message: `${label} added`, module: { ...rows[0], units: [] } });
  } catch (err) {
    console.error('Create module error:', err);
    res.status(500).json({ message: 'Server error while adding the module' });
  }
});

// POST /api/modules/:id/units   { title, pdf_url?, ... }
// Convenience wrapper: adds a unit under module :id without needing the course id.
router.post('/modules/:id/units', async (req, res) => {
  try {
    await ready;
    const parentId = Number(req.params.id);
    const title = (req.body.title || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Unit title is required' });
    }

    const parent = await pool.query('SELECT course_id, parent_id FROM modules WHERE id = $1', [parentId]);
    if (parent.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    if (parent.rows[0].parent_id !== null) {
      return res.status(400).json({ message: 'A unit cannot contain further units' });
    }

    const courseId = parent.rows[0].course_id;
    const position = await nextPosition(courseId, parentId);

    const { rows } = await pool.query(
      `INSERT INTO modules (course_id, parent_id, title, position, pdf_url, video_url, assessment_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        courseId,
        parentId,
        title,
        position,
        nn(req.body.pdf_url),
        nn(req.body.video_url),
        nn(req.body.assessment_url),
      ]
    );
    res.status(201).json({ message: 'Unit added', module: { ...rows[0], units: [] } });
  } catch (err) {
    console.error('Create unit error:', err);
    res.status(500).json({ message: 'Server error while adding the unit' });
  }
});

// PUT /api/modules/:id
// Updates a module or a unit. Pass parent_id to move a row between the two
// levels (null promotes a unit to a module, an id demotes a module to a unit).
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
    const label = m.parent_id !== null ? 'Unit' : 'Module';

    const title = b.title !== undefined ? (b.title || '').trim() : m.title;
    if (!title) {
      return res.status(400).json({ message: `${label} title is required` });
    }

    let parentId = m.parent_id;
    if (b.parent_id !== undefined) {
      parentId = parentOf(b.parent_id);
      if (parentId === m.id) {
        return res.status(400).json({ message: 'A module cannot be its own parent' });
      }
      const parentError = await checkParent(parentId, m.course_id);
      if (parentError) return res.status(400).json({ message: parentError });

      // Nesting a module that still holds units would make the tree 3 deep.
      if (parentId !== null && m.parent_id === null) {
        const kids = await pool.query('SELECT 1 FROM modules WHERE parent_id = $1 LIMIT 1', [m.id]);
        if (kids.rows.length > 0) {
          return res.status(400).json({ message: 'Move or delete the units inside this module before nesting it' });
        }
      }
    }

    // Moving to a new parent puts the row at the end of its new sibling list.
    let position = b.position !== undefined ? Number(b.position) : m.position;
    if (b.position === undefined && parentId !== m.parent_id) {
      position = await nextPosition(m.course_id, parentId);
    }

    const { rows } = await pool.query(
      `UPDATE modules SET
         title=$1, position=$2, parent_id=$3,
         pdf_url=$4, video_url=$5, assessment_url=$6, updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [
        title,
        position,
        parentId,
        b.pdf_url !== undefined ? nn(b.pdf_url) : m.pdf_url,
        b.video_url !== undefined ? nn(b.video_url) : m.video_url,
        b.assessment_url !== undefined ? nn(b.assessment_url) : m.assessment_url,
        req.params.id,
      ]
    );
    res.json({ message: `${label} updated`, module: rows[0] });
  } catch (err) {
    console.error('Update module error:', err);
    res.status(500).json({ message: 'Server error while updating the module' });
  }
});

// DELETE /api/modules/:id
// Deleting a module takes its units with it.
router.delete('/modules/:id', async (req, res) => {
  try {
    await ready;
    const id = Number(req.params.id);
    const { rows } = await pool.query(
      'DELETE FROM modules WHERE id = $1 OR parent_id = $1 RETURNING id, parent_id',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }
    // The units went with it, so their activities have to go too.
    const deletedActivities = await deleteForModules(rows.map((r) => r.id));
    const deletedUnits = rows.filter((r) => Number(r.parent_id) === id).length;
    res.json({
      message: deletedUnits > 0 ? `Module deleted along with ${deletedUnits} unit(s)` : 'Module deleted',
      deleted_units: deletedUnits,
      deleted_activities: deletedActivities,
    });
  } catch (err) {
    console.error('Delete module error:', err);
    res.status(500).json({ message: 'Server error while deleting the module' });
  }
});

module.exports = router;
