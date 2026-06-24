const API_URL = 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

// ─── Auth ───
export const login = (id, password, role) =>
  request('/login', { method: 'POST', body: { id, password, role } });

// ─── Student APIs ───
export const getStudent = (id) => request(`/students/${id}`);
export const getStudentCourses = (id) => request(`/students/${id}/courses`);
export const getStudentGrades = (id) => request(`/students/${id}/grades`);
export const getStudentFinancials = (id) => request(`/students/${id}/financials`);
export const getActiveSemester = () => request(`/students/active-semester`);
export const dropCourse = (studentId, courseId) =>
  request('/students/drop-course', { method: 'POST', body: { studentId, courseId } });
export const dropSemester = (studentId) =>
  request('/students/drop-semester', { method: 'POST', body: { studentId } });

// ─── Advising ───
export const checkAdvisingAccess = (studentId) =>
  request(`/advising/check-access/${studentId}`);
export const getAdvisingCourses = (dept) =>
  request(`/advising/courses?dept=${dept}`);
export const validateAdvising = (studentId, courseId, slipIds) =>
  request('/advising/validate', { method: 'POST', body: { studentId, courseId, slipIds } });
export const confirmAdvising = (studentId, courseIds) =>
  request('/advising/confirm', { method: 'POST', body: { studentId, courseIds } });

// ─── Announcements ───
export const getAnnouncements = () => request('/announcements');

// ─── Admin APIs ───
export const getAdminStudents = (search) =>
  request(`/admin/students${search ? `?search=${encodeURIComponent(search)}` : ''}`);
export const createStudent = (data) =>
  request('/admin/students', { method: 'POST', body: data });
export const updateStudent = (studentId, data) =>
  request(`/admin/students/${studentId}`, { method: 'PUT', body: data });
export const deleteStudent = (studentId) =>
  request(`/admin/students/${studentId}`, { method: 'DELETE' });
export const adminEnrollStudent = (studentDbId, courseCode) =>
  request('/admin/student/enroll', { method: 'POST', body: { studentDbId, courseCode } });
export const adminDropStudent = (studentDbId, type, targetId) =>
  request('/admin/student/drop', { method: 'POST', body: { studentDbId, type, targetId } });

export const getAdminFaculty = () => request('/admin/faculty');
export const createFaculty = (data) =>
  request('/admin/faculty', { method: 'POST', body: data });
export const deleteFaculty = (id) =>
  request(`/admin/faculty/${id}`, { method: 'DELETE' });

export const getAdminCourses = () => request('/admin/courses');
export const createCourse = (data) =>
  request('/admin/courses', { method: 'POST', body: data });
export const deleteCourse = (id) =>
  request(`/admin/courses/${id}`, { method: 'DELETE' });
export const updateCourseCapacity = (id, max_students) =>
  request(`/admin/courses/${id}/capacity`, { method: 'PUT', body: { max_students } });
export const getScheduleConfig = () => request('/admin/config/schedules');

export const searchStudentForGrades = (q) =>
  request(`/admin/grades/search-student?q=${q}`);
export const getPendingCourses = (studentId) =>
  request(`/admin/grades/pending-courses/${studentId}`);
export const submitBatchGrades = (studentId, grades) =>
  request('/admin/grades/batch', { method: 'POST', body: { studentId, grades } });

export const getAdminFinancials = () => request('/admin/financials');
export const updateFinancialStatus = (studentId, status) =>
  request('/admin/financials/status', { method: 'PUT', body: { studentId, status } });

export const createAdmin = (data) =>
  request('/admin/admins', { method: 'POST', body: data });
export const createSemester = (data) =>
  request('/admin/semesters', { method: 'POST', body: data });
export const postAnnouncement = (data) =>
  request('/admin/announcements', { method: 'POST', body: data });

export const getAdminSlots = () => request('/admin/slots');
export const createSlot = (data) =>
  request('/admin/slots', { method: 'POST', body: data });
export const deleteSlot = (id) =>
  request(`/admin/slots/${id}`, { method: 'DELETE' });

// ─── Faculty APIs ───
export const getFacultyCourses = (email) => request(`/faculty/${email}/courses`);
export const getFacultyAdvisees = (email) => request(`/faculty/${email}/advisees`);
export const getFacultyStudentProfile = (id) => request(`/faculty/student-profile/${id}`);
export const getCourseStudents = (courseId) => request(`/faculty/course/${courseId}/students`);
export const submitFacultyGrade = (data) =>
  request('/faculty/grade', { method: 'POST', body: data });
