// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `file_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

function extFilter(allowed, label) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`Only ${label} files are allowed.`));
  };
}

// Images (course image)
const IMAGE_EXT = ['.gif', '.jpe', '.jpeg', '.jpg', '.png', '.svg', '.svgz', '.webp'];
const uploadImage = multer({
  storage,
  fileFilter: extFilter(IMAGE_EXT, 'image (gif, jpg, jpeg, png, svg, webp)'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// Module files (pdf, video, docs)
const FILE_EXT = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt',
  '.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v',
  '.gif', '.jpeg', '.jpg', '.png', '.webp',
];
const uploadFile = multer({
  storage,
  fileFilter: extFilter(FILE_EXT, 'pdf, document, or video'),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2 GB
});

// POST /api/upload  (field: "image")
router.post('/', (req, res) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded (expected field "image").' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
  });
});

// POST /api/upload/file  (field: "file")
router.post('/file', (req, res) => {
  uploadFile.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded (expected field "file").' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
  });
});

module.exports = router;