import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Academics from './pages/public/Academics';
import Admissions from './pages/public/Admissions';
import Research from './pages/public/Research';
import CampusLife from './pages/public/CampusLife';
import News from './pages/public/News';
import Contact from './pages/public/Contact';
import Login from './pages/Login/Login';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard/FacultyDashboard';
import ForceChangePassword from './pages/ForceChangePassword/ForceChangePassword';

function ProtectedRoute({ children, allowedType }) {
  const { user, userType, loading, requiresPasswordChange } = useAuth();

  if (loading) return null;
  if (!user || userType !== allowedType) return <Navigate to="/login" replace />;
  if (requiresPasswordChange) return <Navigate to="/force-change-password" replace />;
  return children;
}

function PasswordChangeRoute({ children }) {
  const { user, loading, requiresPasswordChange, userType } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!requiresPasswordChange) {
    if (userType === 'admin') return <Navigate to="/admin" replace />;
    if (userType === 'faculty') return <Navigate to="/faculty" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ─── Public university website ─── */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/academics" element={<Academics />} />
      <Route path="/admissions" element={<Admissions />} />
      <Route path="/research" element={<Research />} />
      <Route path="/campus-life" element={<CampusLife />} />
      <Route path="/news" element={<News />} />
      <Route path="/contact" element={<Contact />} />

      <Route path="/login" element={<Login />} />
      <Route path="/login/:role" element={<Login />} />

      <Route
        path="/force-change-password"
        element={
          <PasswordChangeRoute>
            <ForceChangePassword />
          </PasswordChangeRoute>
        }
      />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute allowedType="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedType="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute allowedType="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
