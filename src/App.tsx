import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetails from './pages/StudentDetails';
import Workouts from './pages/Workouts';
import Diets from './pages/Diets';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ roles }: { roles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect students to their own profile if they try to access admin routes
    if (user.role === 'student') {
      return <Navigate to={`/students/${user.id}`} replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Layout><Outlet /></Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
          </Route>

          {/* Shared Routes (with internal permission checks) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/students/:id" element={<StudentDetails />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/diets" element={<Diets />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
