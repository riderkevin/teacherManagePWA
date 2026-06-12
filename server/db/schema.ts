import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'teacher.db')

// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

// 开启 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── 建表（表结构与 Dexie schema 一致） ──
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wechatNickname TEXT NOT NULL DEFAULT '',
    wechatId TEXT NOT NULL DEFAULT '',
    isNotSelf INTEGER NOT NULL DEFAULT 0,
    actualStudentName TEXT NOT NULL DEFAULT '',
    docLink TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    trialPrice REAL NOT NULL DEFAULT 0,
    singlePrice REAL NOT NULL DEFAULT 0,
    tenPackPrice REAL NOT NULL DEFAULT 0,
    twentyPackPrice REAL NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    firstTrialDate TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT '仅上试听课',
    instrumentBackground TEXT NOT NULL DEFAULT '',
    musicPreference TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    studentId INTEGER NOT NULL,
    studentName TEXT NOT NULL DEFAULT '',
    startTime TEXT NOT NULL DEFAULT '',
    endTime TEXT NOT NULL DEFAULT '',
    duration REAL NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT '未上课',
    month TEXT NOT NULL DEFAULT '',
    week TEXT NOT NULL DEFAULT '',
    income REAL NOT NULL DEFAULT 0,
    lessonType TEXT NOT NULL DEFAULT '正式课单节',
    packageLabel TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL DEFAULT '',
    parentId INTEGER,
    category TEXT NOT NULL DEFAULT '演奏技法',
    difficulty INTEGER NOT NULL DEFAULT 1,
    fileLink TEXT NOT NULL DEFAULT '',
    fileName TEXT NOT NULL DEFAULT '',
    targetSpeed TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    studentName TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    amount REAL NOT NULL DEFAULT 0,
    packageLabel TEXT NOT NULL DEFAULT '',
    lessonCount INTEGER NOT NULL DEFAULT 10,
    notes TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS lesson_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lessonId INTEGER NOT NULL,
    materialId INTEGER,
    text TEXT NOT NULL DEFAULT '',
    fileName TEXT NOT NULL DEFAULT '',
    fileData TEXT NOT NULL DEFAULT '',
    fileLink TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
  );

  -- 密码表（服务端认证用）
  CREATE TABLE IF NOT EXISTS auth (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    passwordHash TEXT NOT NULL DEFAULT ''
  );

  -- session 表
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    createdAt TEXT NOT NULL DEFAULT ''
  );

  -- 学生微信绑定表
  CREATE TABLE IF NOT EXISTS student_wx_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL UNIQUE,
    wxOpenid TEXT NOT NULL DEFAULT '',
    wxNickname TEXT NOT NULL DEFAULT '',
    wxAvatarUrl TEXT NOT NULL DEFAULT '',
    isBound INTEGER NOT NULL DEFAULT 1,
    boundAt TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
  );

  -- 绑定邀请码表（老师生成邀请码，学生在小程序输入完成绑定）
  CREATE TABLE IF NOT EXISTS bind_codes (
    code TEXT PRIMARY KEY,
    studentId INTEGER NOT NULL,
    studentName TEXT NOT NULL DEFAULT '',
    wxOpenid TEXT NOT NULL DEFAULT '',
    used INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
  );

  -- 乐队日程（演出/排练）
  CREATE TABLE IF NOT EXISTS band_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT '排练',
    title TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    startTime TEXT NOT NULL DEFAULT '',
    endTime TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL DEFAULT ''
  );

  -- 乐队曲目库
  CREATE TABLE IF NOT EXISTS band_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    artist TEXT NOT NULL DEFAULT '',
    duration TEXT NOT NULL DEFAULT '',
    songKey TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
  );

  -- 演出曲目单（关联表）
  CREATE TABLE IF NOT EXISTS band_event_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventId INTEGER NOT NULL,
    songId INTEGER NOT NULL,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (eventId) REFERENCES band_events(id) ON DELETE CASCADE,
    FOREIGN KEY (songId) REFERENCES band_songs(id) ON DELETE CASCADE
  );
`)
export default db
