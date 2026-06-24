import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null); // 'student' | 'admin' | 'faculty'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored sessions on mount
    const storedStudent = localStorage.getItem('san_student');
    const storedAdmin = sessionStorage.getItem('adminUser');
    const storedFaculty = sessionStorage.getItem('facultyUser');

    if (storedStudent) {
      const student = JSON.parse(storedStudent);
      student.dbId = student.id || student._id;
      setUser(student);
      setUserType('student');
    } else if (storedAdmin) {
      setUser(JSON.parse(storedAdmin));
      setUserType('admin');
    } else if (storedFaculty) {
      setUser(JSON.parse(storedFaculty));
      setUserType('faculty');
    }

    setLoading(false);
  }, []);

  const loginStudent = (studentData) => {
    const student = { ...studentData };
    student.dbId = student.id || student._id;
    localStorage.setItem('san_student', JSON.stringify(student));
    setUser(student);
    setUserType('student');
  };

  const loginAdmin = (adminData) => {
    sessionStorage.setItem('adminUser', JSON.stringify(adminData));
    setUser(adminData);
    setUserType('admin');
  };

  const loginFaculty = (facultyData) => {
    sessionStorage.setItem('facultyUser', JSON.stringify(facultyData));
    setUser(facultyData);
    setUserType('faculty');
  };

  const logout = () => {
    localStorage.removeItem('san_student');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('facultyUser');
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
