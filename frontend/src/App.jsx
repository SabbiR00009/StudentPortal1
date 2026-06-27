import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing/Landing';
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
      <Route path="/" element={<Landing />} />
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
