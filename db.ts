import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://vym_user:vym_password@localhost:5432/vym_db',
});

// Initialize tables
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        phone TEXT,
        age INTEGER,
        goal TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workouts (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        date DATE,
        exercises JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS diets (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        meals JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS physical_evaluations (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS food_logs (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        meals JSONB NOT NULL,
        total_macros JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, date)
      );
    `);

    // Add password column to students if it doesn't exist (migration)
    const colCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='students' AND column_name='password'
    `);
    if (colCheck.rowCount === 0) {
      await client.query('ALTER TABLE students ADD COLUMN password TEXT');
    }

    // Workouts migrations (date and exercises)
    const workoutCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='workouts' AND column_name IN ('date', 'exercises')
    `);

    let hasDate = false;
    let hasExercises = false;

    workoutCols.rows.forEach(row => {
      if (row.column_name === 'date') hasDate = true;
      if (row.column_name === 'exercises') hasExercises = true;
    });

    if (!hasDate) await client.query('ALTER TABLE workouts ADD COLUMN date DATE');
    if (!hasExercises) await client.query("ALTER TABLE workouts ADD COLUMN exercises JSONB DEFAULT '[]'::jsonb");

    // Seed admin user if not exists
    const adminCountRes = await client.query('SELECT count(*) FROM admins');
    const count = parseInt(adminCountRes.rows[0].count, 10);
    if (count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await client.query(
        'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
        ['Treinador', 'admin@fitpro.com', hashedPassword]
      );
      console.log('Admin user created: admin@fitpro.com / admin123');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    client.release();
  }
}

initDb();

export default pool;

