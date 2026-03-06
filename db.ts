import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('consultoria.db');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    phone TEXT,
    age INTEGER,
    goal TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    day_of_week TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS diets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    meals JSON, -- Storing meals as JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );
`);

// Add password column to students if it doesn't exist (migration)
try {
  const columns = db.prepare("PRAGMA table_info(students)").all() as any[];
  const hasPassword = columns.some(col => col.name === 'password');
  if (!hasPassword) {
    db.exec('ALTER TABLE students ADD COLUMN password TEXT');
  }
} catch (error) {
  console.error('Error checking/adding password column:', error);
}


// Seed admin user if not exists
const adminCount = db.prepare('SELECT count(*) as count FROM admins').get() as { count: number };
if (adminCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (name, email, password) VALUES (?, ?, ?)').run('Treinador', 'admin@fitpro.com', hashedPassword);
  console.log('Admin user created: admin@fitpro.com / admin123');
}

export default db;
