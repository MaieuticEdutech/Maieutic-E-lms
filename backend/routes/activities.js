// backend/routes/activities.js
// Activities and resources attached to a module or a unit — the Moodle-style
// "Add an activity or resource" list. Each row is one item (a PDF, a video, an
// audio clip, an assignment, a quiz, or a link) belonging to a `modules` row.
//
// This replaces the old fixed pdf_url / video_url / assessment_url columns on
// `modules`; anything already stored in those is migrated across on first run.
//
// Setup: in server.js add
//     const { router: activityRoutes } = require('./routes/activities');
//     app.use('/api', activityRoutes);
//
// Routes (mounted at /api):
//   GET    /modules/:id/activities   list the items inside a module or unit
//   POST   /modules/:id/activities   add an item
//   PUT    /activities/:id           update an item (title / url / type / position)
//   DELETE /activities/:id           delete an item

const express = require('express');
const pool = require('../db');

const router = express.Router();

// The pickable types. `upload` marks the ones that take a file; `link` takes a URL.
const ACTIVITY_TYPES = {
  pdf: { label: 'File / PDF', upload: true },
  video: { label: 'Video', upload: true },
  audio: { label: 'Audio', upload: true },
  assignment: { label: 'Assignment', upload: true },
  quiz: { label: 'Quiz', upload: true },
  link: { label: 'URL / Link', upload: false },
};

const ready = pool
  .query(`
    CREATE TABLE IF NOT EXISTS activities (
      id          SERIAL PRIMARY KEY,
      module_id   INTEGER NOT NULL,
      type        VARCHAR(40) NOT NULL,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      url         VARCHAR(500),
      position    INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  // Tables created before the settings form had no description column.
  .then(() => pool.query('ALTER TABLE activities ADD COLUMN IF NOT EXISTS description TEXT'))
  .then(() => pool.query('CREATE INDEX IF NOT EXISTS idx_activities_module ON activities (module_id)'))
  // Carry across whatever the old three-slot layout had stored. Guarded by NOT
  // EXISTS so a restart never duplicates a row.
  .then(() =>
    pool
      .query(`
        INSERT INTO activities (module_id, type, title, url, position)
        SELECT m.id, t.type, t.title, t.url, t.pos
          FROM modules m
          CROSS JOIN LATERAL (VALUES
            ('pdf'::varchar,        'PDF'::varchar,        m.pdf_url,        0),
            ('video'::varchar,      'Video'::varchar,      m.video_url,      1),
            ('assignment'::varchar, 'Assessment'::varchar, m.assessment_url, 2)
          ) AS t(type, title, url, pos)
         WHERE t.url IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM activities a WHERE a.module_id = m.id AND a.url = t.url
           )
      `)
      .then((r) => {
        if (r.rowCount > 0) console.log(`Migrated ${r.rowCount} module file(s) into activities`);
      })
      // Older installs may not have the legacy columns at all; that is fine.
      .catch((e) => console.warn('Skipped activity migration:', e.message))
  )
  .catch((e) => console.error('Failed to create activities table:', e.message));

const nn = (v) => (v === undefined || v === null || v === '' ? null : v);

// Read every activity for a set of module/unit ids, grouped by module_id.
// Used by modules.js so one course load stays a single extra query.
async function activitiesByModule(moduleIds) {
  const grouped = new Map();
  if (moduleIds.length === 0) return grouped;

  await ready;
  const { rows } = await pool.query(
    'SELECT * FROM activities WHERE module_id = ANY($1::int[]) ORDER BY position ASC, id ASC',
    [moduleIds]
  );
  for (const row of rows) {
    if (!grouped.has(row.module_id)) grouped.set(row.module_id, []);
    grouped.get(row.module_id).push(row);
  }
  return grouped;
}

// Remove the activities belonging to deleted modules/units.
async function deleteForModules(moduleIds) {
  if (moduleIds.length === 0) return 0;
  await ready;
  const { rowCount } = await pool.query('DELETE FROM activities WHERE module_id = ANY($1::int[])', [moduleIds]);
  return rowCount;
}

// GET /api/modules/:id/activities
router.get('/modules/:id/activities', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query(
      'SELECT * FROM activities WHERE module_id = $1 ORDER BY position ASC, id ASC',
      [req.params.id]
    );
    res.json({ activities: rows });
  } catch (err) {
    console.error('List activities error:', err);
    res.status(500).json({ message: 'Server error while fetching activities' });
  }
});

// POST /api/modules/:id/activities   { type, title, url? }
router.post('/modules/:id/activities', async (req, res) => {
  try {
    await ready;
    const moduleId = Number(req.params.id);
    const type = (req.body.type || '').trim();
    const title = (req.body.title || '').trim();

    if (!ACTIVITY_TYPES[type]) {
      return res.status(400).json({ message: `Unknown activity type "${type}"` });
    }
    if (!title) {
      return res.status(400).json({ message: 'Activity title is required' });
    }

    const owner = await pool.query('SELECT id FROM modules WHERE id = $1', [moduleId]);
    if (owner.rows.length === 0) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const pos = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM activities WHERE module_id = $1',
      [moduleId]
    );

    const { rows } = await pool.query(
      `INSERT INTO activities (module_id, type, title, description, url, position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [moduleId, type, title, nn(req.body.description), nn(req.body.url), pos.rows[0].next]
    );
    res.status(201).json({ message: 'Activity added', activity: rows[0] });
  } catch (err) {
    console.error('Create activity error:', err);
    res.status(500).json({ message: 'Server error while adding the activity' });
  }
});

// PUT /api/activities/:id
router.put('/activities/:id', async (req, res) => {
  try {
    await ready;
    const current = await pool.query('SELECT * FROM activities WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    const a = current.rows[0];
    const b = req.body;

    const type = b.type !== undefined ? (b.type || '').trim() : a.type;
    if (!ACTIVITY_TYPES[type]) {
      return res.status(400).json({ message: `Unknown activity type "${type}"` });
    }

    const title = b.title !== undefined ? (b.title || '').trim() : a.title;
    if (!title) {
      return res.status(400).json({ message: 'Activity title is required' });
    }

    const { rows } = await pool.query(
      `UPDATE activities SET type=$1, title=$2, description=$3, url=$4, position=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING *`,
      [
        type,
        title,
        b.description !== undefined ? nn(b.description) : a.description,
        b.url !== undefined ? nn(b.url) : a.url,
        b.position !== undefined ? Number(b.position) : a.position,
        req.params.id,
      ]
    );
    res.json({ message: 'Activity updated', activity: rows[0] });
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ message: 'Server error while updating the activity' });
  }
});

// DELETE /api/activities/:id
router.delete('/activities/:id', async (req, res) => {
  try {
    await ready;
    const { rows } = await pool.query('DELETE FROM activities WHERE id = $1 RETURNING id', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ message: 'Server error while deleting the activity' });
  }
});

module.exports = { router, ready, ACTIVITY_TYPES, activitiesByModule, deleteForModules };
