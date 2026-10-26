const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.static(__dirname));

app.post('/api/auth/register', (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ success: false, message: "Please provide name, email, username, and password." });
  }

  const result = db.createUser(name, email, username, password);
  if (result.success) {
    res.status(201).json({ success: true, message: "Registration successful!" });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Please enter both username and password." });
  }

  const verified = db.verifyUser(username, password);
  if (verified) {
    res.json({ success: true, message: "Login successful!" });
  } else {
    res.status(401).json({ success: false, message: "Invalid username or password." });
  }
});

app.post('/api/resume/upload', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded." });
  }

  db.logResume(req.file.filename, req.file.originalname, req.file.path);
  res.status(200).json({
    success: true,
    message: "Resume successfully analyzed by agent.",
    filename: req.file.originalname,
    storedName: req.file.filename
  });
});

app.post('/api/interview/evaluate', (req, res) => {
  const reportData = req.body;
  if (!reportData || !reportData.role || !reportData.answers) {
    return res.status(400).json({ success: false, message: "Incomplete interview evaluation payload." });
  }

  const id = db.saveReport(reportData);
  res.status(201).json({
    success: true,
    message: "Interview evaluated and stored in database.",
    id
  });
});

app.get('/api/reports/:id', (req, res) => {
  const report = db.getReport(req.params.id);
  if (report) {
    res.json({ success: true, report });
  } else {
    res.status(404).json({ success: false, message: "Interview record not found." });
  }
});

app.post('/api/feedback/submit', (req, res) => {
  const { rating, name, email, comments } = req.body;
  if (!rating || !name || !email || !comments) {
    return res.status(400).json({ success: false, message: "Please fill out rating stars, name, email, and description." });
  }

  const saved = db.saveFeedback({ rating, name, email, comments });
  res.json({
    success: true,
    message: "Feedback submitted. Thank you for your support!",
    data: saved
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/resume', (req, res) => {
  res.sendFile(path.join(__dirname, 'resume.html'));
});
app.get('/interview', (req, res) => {
  res.sendFile(path.join(__dirname, 'interview.html'));
});
app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'results.html'));
});
app.get('/feedback', (req, res) => {
  res.sendFile(path.join(__dirname, 'feedback.html'));
});

app.use((err, req, res, next) => {
  console.error("Global express error:", err.stack);
  res.status(500).json({ success: false, message: "Internal server crash." });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Virtual Interviewer Server Online!`);
  console.log(`🔗 Interface served at: http://localhost:${PORT}`);
  console.log(`📁 Uploads registry saved to: ${uploadDir}`);
  console.log(`======================================================\n`);
});