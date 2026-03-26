import express, { Request, Response, NextFunction } from 'express';

import pool from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import https from 'https';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID;
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY;

// Workaround for corporate proxies / SSL certificate issues & legacy renegotiation
const httpsAgent = new https.Agent({
  secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  rejectUnauthorized: process.env.IGNORE_SSL_ERRORS !== 'true'
});

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: 'admin' | 'student';
        email: string;
      };
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Middleware ---
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') return res.sendStatus(403);
    next();
  };

  // --- Auth Routes ---

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      // Check admin
      const adminRes = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
      const admin = adminRes.rows[0];
      if (admin && bcrypt.compareSync(password, admin.password)) {
        const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { id: admin.id, email: admin.email, role: 'admin', name: admin.name } });
      }

      // Check student
      const studentRes = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
      const student = studentRes.rows[0];
      if (student && student.password && bcrypt.compareSync(password, student.password)) {
        const token = jwt.sign({ id: student.id, email: student.email, role: 'student', name: student.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { id: student.id, email: student.email, role: 'student', name: student.name } });
      }

      res.status(401).json({ error: 'Invalid credentials' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- API Routes ---

  // Students
  app.get('/api/students', authenticateToken, async (req, res) => {
    try {
      if (req.user?.role === 'student') {
        const studentRes = await pool.query('SELECT id, name, email, phone, age, goal, created_at FROM students WHERE id = $1', [req.user.id]);
        return res.json(studentRes.rows);
      }

      const studentsRes = await pool.query('SELECT id, name, email, phone, age, goal, created_at FROM students ORDER BY created_at DESC');
      res.json(studentsRes.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch students' });
    }
  });

  app.get('/api/students/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    if (req.user?.role === 'student' && req.user.id !== Number(id)) {
      return res.sendStatus(403);
    }

    try {
      const studentRes = await pool.query('SELECT id, name, email, phone, age, goal, created_at FROM students WHERE id = $1', [id]);
      const student = studentRes.rows[0];
      if (student) {
        res.json(student);
      } else {
        res.status(404).json({ error: 'Student not found' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch student' });
    }
  });

  app.post('/api/students', authenticateToken, requireAdmin, async (req, res) => {
    const { name, email, phone, age, goal } = req.body;
    const hashedPassword = bcrypt.hashSync('123456', 10);

    try {
      const result = await pool.query(
        'INSERT INTO students (name, email, password, phone, age, goal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [name, email, hashedPassword, phone, age, goal]
      );
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      if (error.code === '23505') { // Postgres unique constraint violation
        return res.status(400).json({ error: 'Email already exists' });
      }
      console.error(error);
      res.status(500).json({ error: 'Failed to create student' });
    }
  });

  app.put('/api/students/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { name, email, phone, age, goal } = req.body;
    const { id } = req.params;
    try {
      await pool.query(
        'UPDATE students SET name = $1, email = $2, phone = $3, age = $4, goal = $5 WHERE id = $6',
        [name, email, phone, age, goal, id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update student' });
    }
  });

  app.delete('/api/students/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM students WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  });

  // Workouts
  app.get('/api/workouts', authenticateToken, async (req, res) => {
    const { student_id } = req.query;

    try {
      if (req.user?.role === 'student') {
        const workoutsRes = await pool.query('SELECT * FROM workouts WHERE student_id = $1 ORDER BY created_at DESC', [req.user.id]);
        return res.json(workoutsRes.rows);
      }

      if (student_id) {
        const workoutsRes = await pool.query('SELECT * FROM workouts WHERE student_id = $1 ORDER BY created_at DESC', [student_id]);
        res.json(workoutsRes.rows);
      } else {
        const workoutsRes = await pool.query('SELECT * FROM workouts ORDER BY created_at DESC');
        res.json(workoutsRes.rows);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch workouts' });
    }
  });

  app.post('/api/workouts', authenticateToken, requireAdmin, async (req, res) => {
    const { student_id, title, description, date, exercises } = req.body;
    try {
      const processedExercises = (exercises || []).map((ex: any) => ({
        ...ex,
        id: ex.id || crypto.randomUUID(),
        isCompleted: ex.isCompleted === true
      }));

      const result = await pool.query(
        'INSERT INTO workouts (student_id, title, description, date, exercises) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [student_id, title, description, date, JSON.stringify(processedExercises)]
      );
      res.json({ id: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create workout' });
    }
  });

  app.put('/api/workouts/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { title, description, date, exercises } = req.body;
    const { id } = req.params;
    try {
      const processedExercises = (exercises || []).map((ex: any) => ({
        ...ex,
        id: ex.id || crypto.randomUUID(),
        isCompleted: ex.isCompleted === true
      }));

      await pool.query(
        'UPDATE workouts SET title = $1, description = $2, date = $3, exercises = $4 WHERE id = $5',
        [title, description, date, JSON.stringify(processedExercises), id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update workout' });
    }
  });

  // Toggle specific exercise completion status for students
  app.patch('/api/workouts/:id/progress', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { exerciseId, isCompleted } = req.body;

    try {
      // First get the current exercises
      const workoutRes = await pool.query('SELECT exercises FROM workouts WHERE id = $1', [id]);
      if (workoutRes.rowCount === 0) return res.status(404).json({ error: 'Workout not found' });

      let exercises = workoutRes.rows[0].exercises || [];
      if (typeof exercises === 'string') {
        try {
          exercises = JSON.parse(exercises);
        } catch (e) {
          exercises = [];
        }
      }
      if (!Array.isArray(exercises)) exercises = [];

      const updatedExercises = exercises.map((ex: any) =>
        ex.id === exerciseId ? { ...ex, isCompleted } : ex
      );

      await pool.query('UPDATE workouts SET exercises = $1 WHERE id = $2', [JSON.stringify(updatedExercises), id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  });

  app.delete('/api/workouts/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM workouts WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete workout' });
    }
  });

  // Diets
  app.get('/api/diets', authenticateToken, async (req, res) => {
    const { student_id } = req.query;

    try {
      if (req.user?.role === 'student') {
        const dietsRes = await pool.query('SELECT * FROM diets WHERE student_id = $1 ORDER BY created_at DESC', [req.user.id]);
        return res.json(dietsRes.rows);
      }

      if (student_id) {
        const dietsRes = await pool.query('SELECT * FROM diets WHERE student_id = $1 ORDER BY created_at DESC', [student_id]);
        res.json(dietsRes.rows);
      } else {
        const dietsRes = await pool.query('SELECT * FROM diets ORDER BY created_at DESC');
        res.json(dietsRes.rows);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch diets' });
    }
  });

  app.post('/api/diets', authenticateToken, requireAdmin, async (req, res) => {
    const { student_id, title, description, meals } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO diets (student_id, title, description, meals) VALUES ($1, $2, $3, $4) RETURNING id',
        [student_id, title, description, JSON.stringify(meals)]
      );
      res.json({ id: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create diet' });
    }
  });

  app.delete('/api/diets/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM diets WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete diet' });
    }
  });

  // Physical Evaluations
  app.get('/api/evaluations', authenticateToken, async (req, res) => {
    const { student_id } = req.query;
    try {
      if (req.user?.role === 'student') {
        const evalsRes = await pool.query('SELECT * FROM physical_evaluations WHERE student_id = $1 ORDER BY date DESC', [req.user.id]);
        return res.json(evalsRes.rows);
      }
      if (student_id) {
        const evalsRes = await pool.query('SELECT * FROM physical_evaluations WHERE student_id = $1 ORDER BY date DESC', [student_id]);
        res.json(evalsRes.rows);
      } else {
        const evalsRes = await pool.query('SELECT * FROM physical_evaluations ORDER BY date DESC');
        res.json(evalsRes.rows);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch evaluations' });
    }
  });

  app.post('/api/evaluations', authenticateToken, requireAdmin, async (req, res) => {
    const { student_id, date, data } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO physical_evaluations (student_id, date, data) VALUES ($1, $2, $3) RETURNING id',
        [student_id, date, JSON.stringify(data)]
      );
      res.json({ id: result.rows[0].id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create evaluation' });
    }
  });

  app.put('/api/evaluations/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { date, data } = req.body;
    const { id } = req.params;
    try {
      await pool.query(
        'UPDATE physical_evaluations SET date = $1, data = $2 WHERE id = $3',
        [date, JSON.stringify(data), id]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update evaluation' });
    }
  });

  app.delete('/api/evaluations/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM physical_evaluations WHERE id = $1', [id]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete evaluation' });
    }
  });

  // FatSecret & Food Logs
  app.get('/api/food/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    try {
      if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
         return res.status(500).json({ error: 'Edamam credentials not configured' });
      }

      const url = new URL('https://api.edamam.com/api/food-database/v2/parser');
      url.searchParams.append('app_id', EDAMAM_APP_ID);
      url.searchParams.append('app_key', EDAMAM_APP_KEY);
      url.searchParams.append('ingr', q as string);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Accept-Language': 'pt-BR'
        }
      } as any);

      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Edamam search failed' });
    }
  });

  // Edamam handles details in the same parser or via specific foodId in a nutrition call.
  // For simplicity, search returns enough data (hints) to avoid a second call for core macros.
  app.get('/api/food/details/:id', authenticateToken, async (req, res) => {
    res.status(404).json({ error: 'Use search results for food details with Edamam' });
  });

  app.get('/api/food/logs', authenticateToken, async (req, res) => {
    const { student_id, date } = req.query;
    try {
      const targetId = req.user?.role === 'student' ? req.user.id : student_id;
      const logsRes = await pool.query('SELECT * FROM food_logs WHERE student_id = $1 AND date = $2', [targetId, date]);
      res.json(logsRes.rows[0] || { meals: [], total_macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch food logs' });
    }
  });

  app.post('/api/food/logs', authenticateToken, async (req, res) => {
    const { date, meals, total_macros } = req.body;
    const student_id = req.user?.id;
    
    if (req.user?.role !== 'student') return res.status(403).json({ error: 'Only students can log food' });

    try {
      await pool.query(
        `INSERT INTO food_logs (student_id, date, meals, total_macros) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (student_id, date) 
         DO UPDATE SET meals = $3, total_macros = $4`,
        [student_id, date, JSON.stringify(meals), JSON.stringify(total_macros)]
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save food log' });
    }
  });


  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production' && process.env.VITE_DISABLED !== 'true') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const path = await import('path');
      const vite = await createViteServer({
        configFile: path.resolve(process.cwd(), 'vite.config.ts').replace(/\\/g, '/'),
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('Vite middleware enabled');
    } catch (err) {
      console.warn('Vite not found or failed to load, falling back to static files:', err);
      await serveStatic(app);
    }
  } else {
    await serveStatic(app);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

async function serveStatic(app: any) {
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url)).replace(/\\/g, '/');
  
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));

  app.get('*', (req: any, res: any) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

startServer();
