const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'db.json');

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialStructure = {
      users: [],
      resumes: [],
      reports: [],
      feedback: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialStructure, null, 2), 'utf8');
  }
}

function readDB() {
  initDB();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file:", err);
    return { users: [], resumes: [], reports: [], feedback: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing to database file:", err);
    return false;
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function findUser(username) {
  const db = readDB();
  return db.users.find(u => u.username === username);
}

function createUser(name, email, username, password) {
  const db = readDB();
  if (findUser(username)) {
    return { success: false, message: "Username already taken." };
  }
  const newUser = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    name,
    email,
    username,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  writeDB(db);
  return { success: true, user: { id: newUser.id, username: newUser.username } };
}

function verifyUser(username, password) {
  const user = findUser(username);
  if (!user) return false;
  return user.passwordHash === hashPassword(password);
}

function logResume(filename, originalName, filepath) {
  const db = readDB();
  const newResume = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    filename,
    originalName,
    filepath,
    uploadedAt: new Date().toISOString()
  };
  db.resumes.push(newResume);
  writeDB(db);
  return newResume;
}

function saveReport(reportData) {
  const db = readDB();
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const newReport = {
    id,
    ...reportData,
    createdAt: new Date().toISOString()
  };
  db.reports.push(newReport);
  writeDB(db);
  return id;
}

function getReport(id) {
  const db = readDB();
  return db.reports.find(r => r.id === id);
}

function saveFeedback(feedbackData) {
  const db = readDB();
  const newFeedback = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
    ...feedbackData,
    createdAt: new Date().toISOString()
  };
  db.feedback.push(newFeedback);
  writeDB(db);
  return newFeedback;
}

module.exports = {
  createUser,
  verifyUser,
  logResume,
  saveReport,
  getReport,
  saveFeedback
};