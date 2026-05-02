const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../gitguard.db');
const db = new Database(DB_PATH);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT NOT NULL,
      pr_number INTEGER NOT NULL,
      pr_title TEXT,
      pr_author TEXT,
      pr_url TEXT,
      ai_review TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS repo_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT UNIQUE NOT NULL,
      strict_mode INTEGER DEFAULT 0,
      ignore_styling INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized');
}

function saveReview(data) {
  const stmt = db.prepare(`
    INSERT INTO reviews (repo_name, pr_number, pr_title, pr_author, pr_url, ai_review)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(data.repo_name, data.pr_number, data.pr_title, data.pr_author, data.pr_url, data.ai_review);
}

function getAllReviews() {
  return db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
}

function getRepoSettings(repoName) {
  return db.prepare('SELECT * FROM repo_settings WHERE repo_name = ?').get(repoName);
}

function upsertRepoSettings(repoName, settings) {
  const stmt = db.prepare(`
    INSERT INTO repo_settings (repo_name, strict_mode, ignore_styling, enabled)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(repo_name) DO UPDATE SET
      strict_mode = excluded.strict_mode,
      ignore_styling = excluded.ignore_styling,
      enabled = excluded.enabled,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(repoName, settings.strict_mode ? 1 : 0, settings.ignore_styling ? 1 : 0, settings.enabled ? 1 : 0);
}

module.exports = { initDatabase, saveReview, getAllReviews, getRepoSettings, upsertRepoSettings, db };