import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logoutUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'student' | 'admin' | 'faculty'
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session via backend cookie
    getMe()
      .then((data) => {
        if (data.success && data.user) {
          const u = { ...data.user };
          u.dbId = u.id || u._id;
          setUser(u);
          setUserType(data.userType);
          setRequiresPasswordChange(data.requiresPasswordChange || false);
        } else {
          setUser(null);
          setUserType(null);
          setRequiresPasswordChange(false);
        }
      })
      .catch(() => {
        setUser(null);
        setUserType(null);
        setRequiresPasswordChange(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginStudent = (studentData, mustChange) => {
    const student = { ...studentData };
    student.dbId = student.id || student._id;
    setUser(student);
    setUserType('student');
    setRequiresPasswordChange(mustChange);
  };

  const loginAdmin = (adminData, mustChange) => {
    setUser(adminData);
    setUserType('admin');
    setRequiresPasswordChange(mustChange);
  };

  const loginFaculty = (facultyData, mustChange) => {
    setUser(facultyData);
    setUserType('faculty');
    setRequiresPasswordChange(mustChange);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("Logout error", e);
    }
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, requiresPasswordChange, setRequiresPasswordChange, loading, loginStudent, loginAdmin, loginFaculty, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
