import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import db from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-change-this'; // In production use env var

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

  app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Check admin
    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as any;
    if (admin && bcrypt.compareSync(password, admin.password)) {
      const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin', name: admin.name }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { id: admin.id, email: admin.email, role: 'admin', name: admin.name } });
    }

    // Check student
    const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email) as any;
    if (student && student.password && bcrypt.compareSync(password, student.password)) {
      const token = jwt.sign({ id: student.id, email: student.email, role: 'student', name: student.name }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { id: student.id, email: student.email, role: 'student', name: student.name } });
    }

    res.status(401).json({ error: 'Invalid credentials' });
  });

  // --- API Routes ---

  // Students
  app.get('/api/students', authenticateToken, (req, res) => {
    if (req.user?.role === 'student') {
      // Students can only see themselves
      const stmt = db.prepare('SELECT id, name, email, phone, age, goal, created_at FROM students WHERE id = ?');
      const student = stmt.get(req.user.id);
      return res.json([student]);
    }
    
    // Admins see all
    const stmt = db.prepare('SELECT id, name, email, phone, age, goal, created_at FROM students ORDER BY created_at DESC');
    const students = stmt.all();
    res.json(students);
  });

  app.get('/api/students/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    // Check permissions
    if (req.user?.role === 'student' && req.user.id !== Number(id)) {
      return res.sendStatus(403);
    }

    const stmt = db.prepare('SELECT id, name, email, phone, age, goal, created_at FROM students WHERE id = ?');
    const student = stmt.get(id);
    if (student) {
      res.json(student);
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  });

  app.post('/api/students', authenticateToken, requireAdmin, (req, res) => {
    const { name, email, phone, age, goal } = req.body;
    // Default password is '123456' for new students
    const hashedPassword = bcrypt.hashSync('123456', 10);
    
    try {
      const stmt = db.prepare('INSERT INTO students (name, email, password, phone, age, goal) VALUES (?, ?, ?, ?, ?, ?)');
      const info = stmt.run(name, email, hashedPassword, phone, age, goal);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Failed to create student' });
    }
  });

  app.put('/api/students/:id', authenticateToken, requireAdmin, (req, res) => {
    const { name, email, phone, age, goal } = req.body;
    const { id } = req.params;
    const stmt = db.prepare('UPDATE students SET name = ?, email = ?, phone = ?, age = ?, goal = ? WHERE id = ?');
    stmt.run(name, email, phone, age, goal, id);
    res.json({ success: true });
  });

  app.delete('/api/students/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  });

  // Workouts
  app.get('/api/workouts', authenticateToken, (req, res) => {
    const { student_id } = req.query;
    
    // Students can only see their own workouts
    if (req.user?.role === 'student') {
      const stmt = db.prepare('SELECT * FROM workouts WHERE student_id = ? ORDER BY created_at DESC');
      return res.json(stmt.all(req.user.id));
    }

    // Admins
    let stmt;
    if (student_id) {
      stmt = db.prepare('SELECT * FROM workouts WHERE student_id = ? ORDER BY created_at DESC');
      res.json(stmt.all(student_id));
    } else {
      stmt = db.prepare('SELECT * FROM workouts ORDER BY created_at DESC');
      res.json(stmt.all());
    }
  });

  app.post('/api/workouts', authenticateToken, requireAdmin, (req, res) => {
    const { student_id, title, description, video_url, day_of_week } = req.body;
    const stmt = db.prepare('INSERT INTO workouts (student_id, title, description, video_url, day_of_week) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(student_id, title, description, video_url, day_of_week);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/workouts/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM workouts WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  });

  // Diets
  app.get('/api/diets', authenticateToken, (req, res) => {
    const { student_id } = req.query;
    
    // Students can only see their own diets
    if (req.user?.role === 'student') {
      const stmt = db.prepare('SELECT * FROM diets WHERE student_id = ? ORDER BY created_at DESC');
      return res.json(stmt.all(req.user.id));
    }

    // Admins
    let stmt;
    if (student_id) {
      stmt = db.prepare('SELECT * FROM diets WHERE student_id = ? ORDER BY created_at DESC');
      res.json(stmt.all(student_id));
    } else {
      stmt = db.prepare('SELECT * FROM diets ORDER BY created_at DESC');
      res.json(stmt.all());
    }
  });

  app.post('/api/diets', authenticateToken, requireAdmin, (req, res) => {
    const { student_id, title, description, meals } = req.body;
    const stmt = db.prepare('INSERT INTO diets (student_id, title, description, meals) VALUES (?, ?, ?, ?)');
    const info = stmt.run(student_id, title, description, JSON.stringify(meals));
    res.json({ id: info.lastInsertRowid });
  });

  app.delete('/api/diets/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM diets WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  });


  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
