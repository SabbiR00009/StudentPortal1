import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, logoutUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'student' | 'admin' | 'faculty'
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
        } else {
          setUser(null);
          setUserType(null);
        }
      })
      .catch(() => {
        setUser(null);
        setUserType(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginStudent = (studentData) => {
    const student = { ...studentData };
    student.dbId = student.id || student._id;
    setUser(student);
    setUserType('student');
  };

  const loginAdmin = (adminData) => {
    setUser(adminData);
    setUserType('admin');
  };

  const loginFaculty = (facultyData) => {
    setUser(facultyData);
    setUserType('faculty');
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
    setUserType(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, userType, loading, loginStudent, loginAdmin, loginFaculty, logout }}
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
