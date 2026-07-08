// Same-origin relative API base. In dev, Vite proxies `/api` to the backend;
// in production this server serves both the app and the API. Override with
// VITE_API_URL only for a cross-site (separate-domain) deployment.
export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const request = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
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
export const logoutUser = () =>
  request('/logout', { method: 'POST' });
export const getMe = () =>
  request('/me');
export const changePassword = (currentPassword, newPassword) =>
  request('/change-password', { method: 'POST', body: { currentPassword, newPassword } });

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
export const getDropRequest = (studentId) =>
  request(`/students/${studentId}/drop-request`);
export const submitDropRequest = (studentId, reason) =>
  request('/students/drop-request', { method: 'POST', body: { studentId, reason } });

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

// ─── Public contact form ───
export const submitContact = (data) =>
  request('/contact', { method: 'POST', body: data });

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
export const createFaculty = (data) => request('/admin/faculty', { method: 'POST', body: data });
export const updateFaculty = (id, data) => request(`/admin/faculty/${id}`, { method: 'PUT', body: data });
export const getAdminFacultyCourses = (id) => request(`/admin/faculty/${id}/courses`);
export const deleteFaculty = (id) => request(`/admin/faculty/${id}`, { method: 'DELETE' });

export const getAdminCourses = () => request('/admin/courses');
export const createCourse = (data) =>
  request('/admin/courses', { method: 'POST', body: data });
export const deleteCourse = (id) =>
  request(`/admin/courses/${id}`, { method: 'DELETE' });
export const updateCourse = (id, data) =>
  request(`/admin/courses/${id}`, { method: 'PUT', body: data });
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
export const createSemester = (semesterData) =>
  request('/admin/semesters', { method: 'POST', body: semesterData });
export const postAnnouncement = (announcementData) =>
  request('/admin/announcements', { method: 'POST', body: announcementData });

// ─── Admin Drop Requests ───
export const getAdminDropRequests = () =>
  request('/admin/drop-requests');
export const updateDropRequestStatus = (id, status, adminResponse) =>
  request(`/admin/drop-requests/${id}/status`, { method: 'PUT', body: { status, adminResponse } });

// ─── Messaging ───
export const getStudentMessages = () => request('/student/messages');
export const getFacultyContacts = () => request('/student/messages/faculty-contacts');
export const sendStudentMessage = (data) => request('/student/messages', { method: 'POST', body: data });
export const getMessageThread = (id) => request(`/student/messages/${id}`);
export const replyToMessage = (id, data) => request(`/student/messages/${id}/reply`, { method: 'POST', body: data });

export const getAdminOverviewStats = () => request('/admin/overview-stats');
export const getAdminMessages = () => request('/admin/messages');
export const getAdminMessageThread = (id) => request(`/admin/messages/${id}`);
export const replyToAdminMessage = (id, data) => request(`/admin/messages/${id}/reply`, { method: 'POST', body: data });
export const updateMessageStatus = (id, status) => request(`/admin/messages/${id}/status`, { method: 'PUT', body: { status } });

export const getAdminSlots = () => request('/admin/slots');
export const createSlot = (data) =>
  request('/admin/slots', { method: 'POST', body: data });
export const deleteSlot = (id) =>
  request(`/admin/slots/${id}`, { method: 'DELETE' });

export const getDropPeriods = () => request('/admin/drop-periods');
export const createDropPeriod = (data) =>
  request('/admin/drop-periods', { method: 'POST', body: data });
export const deleteDropPeriod = (id) =>
  request(`/admin/drop-periods/${id}`, { method: 'DELETE' });

export const getSettings = () => request('/admin/settings');
export const updateSettings = (key, value) =>
  request('/admin/settings', { method: 'PUT', body: { key, value } });

// ─── Faculty APIs ───
export const getFacultyCourses = (email) => request(`/faculty/${email}/courses`);
export const getFacultyAdvisees = (email) => request(`/faculty/${email}/advisees`);
export const getFacultyStudentProfile = (id) => request(`/faculty/student-profile/${id}`);
export const getCourseStudents = (courseId) => request(`/faculty/course/${courseId}/students`);
export const submitFacultyGrade = (data) =>
  request('/faculty/grade', { method: 'POST', body: data });

// ─── Password Reset ───
export const submitPasswordResetRequest = (student_id, email, dob) =>
  request('/password-reset-request', { method: 'POST', body: { student_id, email, dob } });
export const getAdminPasswordResetRequests = () =>
  request('/admin/password-reset-requests');
export const updatePasswordResetRequestStatus = (id, status, admin_note) =>
  request(`/admin/password-reset-requests/${id}/status`, { method: 'PUT', body: { status, admin_note } });
