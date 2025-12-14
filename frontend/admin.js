const API_URL = "http://localhost:3000/api";
let currentEditingStudentId = null; // Tracks the DB ID of the student being edited
let scheduleConfig = []; // Global Cache for Schedule Rules

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial Data Load
  loadStudents();
  loadFacultyForDropdowns();
  loadScheduleConfig(); // <--- NEW: Load Schedule Rules from DB

  // 2. Event Listeners for Forms
  document.getElementById("addCourseForm").addEventListener("submit", addCourse);
  document.getElementById("gradeForm").addEventListener("submit", uploadGrade);
  document.getElementById("announcementForm").addEventListener("submit", postAnnouncement);
  document.getElementById("addSemesterForm").addEventListener("submit", addSemester);
  document.getElementById("newStudentForm").addEventListener("submit", registerStudent);
  document.getElementById("addAdminForm").addEventListener("submit", addAdmin);
  document.getElementById("editStudentForm").addEventListener("submit", updateStudentProfile);

  // Faculty Form Listener
  const facultyForm = document.getElementById("newFacultyForm");
  if (facultyForm) facultyForm.addEventListener("submit", registerFaculty);

  // Advising Slots Form
  const slotForm = document.getElementById("addSlotForm");
  if (slotForm) slotForm.addEventListener("submit", addSlot);

  // 3. Logo Click -> Go to Overview
  const adminLogo = document.getElementById("adminNavLogo");
  if (adminLogo) {
    adminLogo.addEventListener("click", () => {
      const overviewBtn = document.querySelector('.nav-btn[onclick*="overview"]');
      switchAdminView("overview", overviewBtn);
    });
  }

  // 4. Setup Admin Avatar
  setupAdminAvatar();
});

// --- HELPER: LOAD FACULTY FOR DROPDOWNS ---
async function loadFacultyForDropdowns() {
  try {
    const res = await fetch(`${API_URL}/admin/faculty`);
    const faculty = await res.json();

    const options = `<option value="" disabled selected>Select Faculty Advisor...</option>` +
      faculty.map(f => `<option value="${f.email}" data-name="${f.name}">${f.name} (${f.department})</option>`).join("");

    const nsSelect = document.getElementById("nsAdvisorSelect");
    if (nsSelect) nsSelect.innerHTML = options;

    const editSelect = document.getElementById("editAdvisorSelect");
    if (editSelect) editSelect.innerHTML = options;

  } catch (e) {
    console.error("Error loading faculty for dropdowns:", e);
  }
}

// --- NEW HELPER: LOAD SCHEDULE CONFIG FROM DB ---
async function loadScheduleConfig() {
  try {
    const res = await fetch(`${API_URL}/admin/config/schedules`);
    scheduleConfig = await res.json();

    // Populate Theory Days
    const daySelect = document.getElementById("cTheoryDays");
    const days = scheduleConfig.filter(r => r.category === 'theory_day');
    if (daySelect) daySelect.innerHTML = days.map(r => `<option value="${r.value}">${r.display}</option>`).join("");

    // Populate Theory Times
    const timeSelect = document.getElementById("cTheoryTime");
    const times = scheduleConfig.filter(r => r.category === 'theory_slot');
    if (timeSelect) timeSelect.innerHTML = times.map(r => `<option value="${r.value}">${r.display}</option>`).join("");

    // Populate Lab Days
    const labDaySelect = document.getElementById("cLabDay");
    const labDays = scheduleConfig.filter(r => r.category === 'lab_day');
    if (labDaySelect) labDaySelect.innerHTML = labDays.map(r => `<option value="${r.value}">${r.display}</option>`).join("");

  } catch (e) {
    console.error("Error loading schedule config:", e);
  }
}

// --- NEW HELPER: HANDLE CREDIT CHANGE (Lab Logic) ---
function handleCreditChange() {
  const credits = document.getElementById("cCredits").value;
  const labSection = document.getElementById("labSection");
  const labTimeSelect = document.getElementById("cLabTime");

  labTimeSelect.innerHTML = "";

  if (credits === "4" || credits === "4.5") {
    labSection.style.display = "block";
    document.getElementById("cLabDay").required = true;
    document.getElementById("cLabTime").required = true;

    // 4 Credits = 2h blocks, 4.5 Credits = 3h blocks
    const category = (credits === "4") ? 'lab_slot_2h' : 'lab_slot_3h';
    const slots = scheduleConfig.filter(r => r.category === category);

    labTimeSelect.innerHTML = slots.map(r => `<option value="${r.value}">${r.display}</option>`).join("");

  } else {
    labSection.style.display = "none";
    document.getElementById("cLabDay").required = false;
    document.getElementById("cLabTime").required = false;
    document.getElementById("cLabDay").value = "";
    document.getElementById("cLabTime").value = "";
  }
}

// --- NEW HELPER: LOAD INSTRUCTORS FOR COURSE FORM ---
async function loadInstructorsForCourse() {
  const dept = document.getElementById("cDept").value;
  const instSelect = document.getElementById("cInstructor");

  instSelect.innerHTML = '<option>Loading...</option>';
  instSelect.disabled = true;

  try {
    const res = await fetch(`${API_URL}/admin/faculty`);
    const faculty = await res.json();
    const deptFaculty = faculty.filter(f => f.department === dept);

    if (deptFaculty.length === 0) {
      instSelect.innerHTML = '<option value="">No instructors found</option>';
    } else {
      instSelect.innerHTML = deptFaculty.map(f => `<option value="${f.name}">${f.name}</option>`).join("");
      instSelect.disabled = false;
    }
  } catch (e) {
    console.error(e);
    instSelect.innerHTML = '<option>Error loading</option>';
  }
}

// --- ADMIN AVATAR & PROFILE LOGIC ---
function setupAdminAvatar() {
  const adminData = JSON.parse(sessionStorage.getItem('adminUser'));
  const avatarEl = document.querySelector('.navbar .user-avatar');

  if (adminData && avatarEl) {
    const nameEl = document.getElementById("adminName");
    if (nameEl) nameEl.innerText = adminData.name;

    const imgUrl = `https://ui-avatars.com/api/?name=${adminData.name}&background=dc2626&color=fff`;
    avatarEl.innerHTML = `<img src="${imgUrl}" alt="Admin">`;

    avatarEl.addEventListener('click', () => {
      loadAdminProfile(adminData);
      switchAdminView('profile', null);
    });
  }
}

function loadAdminProfile(admin) {
  document.getElementById('adminProfileName').innerText = admin.name;
  document.getElementById('adminProfileEmail').innerText = admin.email;
  document.getElementById('adminProfileImg').src = `https://ui-avatars.com/api/?name=${admin.name}&background=dc2626&color=fff&size=128`;
}

// --- NAVIGATION ---
function switchAdminView(viewName, btn) {
  document.querySelectorAll(".view-section").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.remove("active"));

  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add("active");

  if (btn) btn.classList.add("active");

  if (viewName === "students") loadStudents();
  if (viewName === "financials") loadFinancials();
  if (viewName === "faculty") loadFaculty();
  if (viewName === "slots") loadSlots();
  if (viewName === "courses") loadAdminCourses();
}

function logout() {
  sessionStorage.removeItem('adminUser');
  window.location.href = "index.html";
}

// =========================================================
// 1. MANAGE STUDENTS
// =========================================================

async function loadStudents() {
  // 1. Get the value from the search bar
  const searchInput = document.getElementById("studentSearch");
  const searchTerm = searchInput ? searchInput.value : "";

  // 2. Build the URL (Append query if search exists)
  const url = searchTerm
    ? `${API_URL}/admin/students?search=${encodeURIComponent(searchTerm)}`
    : `${API_URL}/admin/students`;

  try {
    const res = await fetch(url);
    const students = await res.json();
    const tbody = document.getElementById("studentList");

    // 3. Handle Empty State
    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #666;">No students found.</td></tr>';
      return;
    }

    // 4. Render Table Rows
    tbody.innerHTML = students.map((s) => `
            <tr>
                <td><strong>${s.student_id}</strong></td>
                <td>
                    <div style="font-weight:600;">${s.name}</div>
                    <div style="font-size:0.8em; color:#666;">${s.email}</div>
                </td>
                <td><span class="dept-badge">${s.department}</span></td>
                <td>${s.advisor_name || '<span style="color:#ccc;">None</span>'}</td>
                <td>
                    <div style="display:flex; gap: 8px;">
                        <button onclick="openEditStudentModal('${s.student_id}', ${s.id})" class="action-btn" title="Edit">
                            <i class="fas fa-edit" style="color:#4F46E5;"></i>
                        </button>
                        <button onclick="deleteStudent('${s.student_id}')" class="action-btn" title="Delete">
                            <i class="fas fa-trash" style="color:#dc2626;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
  } catch (e) {
    console.error("Error loading students:", e);
  }
}

// This function is called by the HTML onkeyup event
function searchStudents() {
  loadStudents();
}
function openAddStudentModal() { document.getElementById("studentModal").style.display = "flex"; }

async function registerStudent(e) {
  e.preventDefault();
  const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : "";

  const advSelect = document.getElementById("nsAdvisorSelect");
  let advName = "Not Assigned";
  let advEmail = "";

  if (advSelect.selectedIndex > 0) {
    const selectedOpt = advSelect.options[advSelect.selectedIndex];
    advEmail = advSelect.value;
    advName = selectedOpt.getAttribute("data-name");
  }

  const body = {
    name: getVal("nsName"),
    phone: getVal("nsPhone"),
    department: getVal("nsDept"),
    admitted_year: getVal("nsYear"),
    admitted_semester: getVal("nsSem"),
    program: getVal("nsProgram"),
    advisor_name: advName,
    advisor_email: advEmail,
  };

  try {
    const res = await fetch(`${API_URL}/admin/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      alert(data.message);
      document.getElementById("studentModal").style.display = "none";
      e.target.reset();
      loadStudents();
    } else {
      alert("Error: " + (data.error || data.message));
    }
  } catch (err) {
    console.error(err);
    alert("Connection Error");
  }
}

async function deleteStudent(studentId) {
  if (!confirm(`Permanently delete student ${studentId}?`)) return;
  try {
    await fetch(`${API_URL}/admin/students/${studentId}`, { method: "DELETE" });
    loadStudents();
  } catch (e) {
    alert("Error");
  }
}

// =========================================================
// 2. FACULTY MANAGEMENT
// =========================================================
function openAddFacultyModal() { document.getElementById("facultyModal").style.display = "flex"; }

async function registerFaculty(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById("nfName").value,
    department: document.getElementById("nfDept").value,
    designation: document.getElementById("nfDesignation").value
  };

  try {
    const res = await fetch(`${API_URL}/admin/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      document.getElementById("facultyModal").style.display = 'none';
      e.target.reset();
      loadFaculty();
      loadFacultyForDropdowns();
    } else {
      alert("Error: " + (data.error || "Unknown Error"));
    }
  } catch (err) {
    alert("Connection Error");
  }
}

async function loadFaculty() {
  const res = await fetch(`${API_URL}/admin/faculty`);
  const faculty = await res.json();
  document.getElementById("facultyList").innerHTML = faculty.map((f) => `
        <tr>
            <td>${f.faculty_id}</td>
            <td>${f.name}</td>
            <td>${f.email}</td>
            <td>${f.department}</td>
            <td>${f.designation || 'Lecturer'}</td>
            <td><button onclick="deleteFaculty(${f.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join("");
}

async function deleteFaculty(id) {
  if (!confirm("Delete Faculty Member?")) return;
  await fetch(`${API_URL}/admin/faculty/${id}`, { method: "DELETE" });
  loadFaculty();
  loadFacultyForDropdowns();
}

// =========================================================
// 3. EDIT STUDENT & COURSE MANAGEMENT LOGIC
// =========================================================

async function openEditStudentModal(studentId, dbId) {
  currentEditingStudentId = dbId;
  await loadFacultyForDropdowns();

  const res = await fetch(`${API_URL}/students/${dbId}`);
  const s = await res.json();

  document.getElementById("editStudentDbId").value = dbId;
  document.getElementById("editStudentId").value = s.student_id;
  document.getElementById("editName").value = s.name;
  document.getElementById("editDept").value = s.department;
  document.getElementById("editProgram").value = s.program || "";
  document.getElementById("editYear").value = s.year;
  document.getElementById("editSemester").value = s.semester;
  document.getElementById("editEmail").value = s.email;
  document.getElementById("editPhone").value = s.phone || "";
  document.getElementById("editDob").value = s.dob || "";
  document.getElementById("editBlood").value = s.blood_group || "";
  document.getElementById("editPresentAddr").value = s.present_address || "";

  const advSelect = document.getElementById("editAdvisorSelect");
  if (s.advisor_email) {
    advSelect.value = s.advisor_email;
  } else {
    advSelect.value = "";
  }

  loadAdminStudentCourses(dbId);
  document.getElementById("editStudentModal").style.display = "flex";
}

async function updateStudentProfile(e) {
  e.preventDefault();
  const dbId = document.getElementById("editStudentDbId").value;
  const studentId = document.getElementById("editStudentId").value;

  const advSelect = document.getElementById("editAdvisorSelect");
  let advName = "";
  let advEmail = "";

  if (advSelect.selectedIndex > 0) {
    const selectedOpt = advSelect.options[advSelect.selectedIndex];
    advEmail = advSelect.value;
    advName = selectedOpt.getAttribute("data-name");
  }

  const body = {
    name: document.getElementById("editName").value,
    phone: document.getElementById("editPhone").value,
    department: document.getElementById("editDept").value,
    program: document.getElementById("editProgram").value,
    year: document.getElementById("editYear").value,
    semester: document.getElementById("editSemester").value,
    dob: document.getElementById("editDob").value,
    blood_group: document.getElementById("editBlood").value,
    present_address: document.getElementById("editPresentAddr").value,
    advisor_name: advName,
    advisor_email: advEmail,
  };

  try {
    const res = await fetch(`${API_URL}/admin/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      alert("Profile Updated!");
      document.getElementById("editStudentModal").style.display = "none";
      loadStudents();
    }
  } catch (e) {
    alert("Update Failed");
  }
}

// =========================================================
// 4. ADMIN COURSE ACTIONS FOR STUDENT (ENROLL/DROP)
// =========================================================

async function loadAdminStudentCourses(dbId) {
  const res = await fetch(`${API_URL}/students/${dbId}/courses`);
  const courses = await res.json();
  const enrolled = courses.filter((c) => c.status === "enrolled");

  const listDiv = document.getElementById("adminStudentCoursesList");

  if (enrolled.length === 0) {
    listDiv.innerHTML = '<p style="color:#666; font-style:italic; padding:10px; text-align:center;">No active courses.</p>';
  } else {
    listDiv.innerHTML = `<table style="width:100%; font-size:0.9em; border-collapse: collapse;">
            ${enrolled.map((c) => `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:8px;"><b>${c.code}</b></td>
                    <td style="padding:8px;">${c.name}</td>
                    <td style="text-align:right; padding:8px;">
                        <button type="button" onclick="adminDropCourse(${c.id})" style="color:red; border:none; background:none; cursor:pointer; font-size:1.1em;" title="Drop Course">
                            <i class="fas fa-minus-circle"></i>
                        </button>
                    </td>
                </tr>
            `).join("")}
        </table>`;
  }
  loadAdminAvailableCourses(dbId);
}

async function loadAdminAvailableCourses(dbId) {
  try {
    const [catRes, stuRes] = await Promise.all([
      fetch(`${API_URL}/advising/courses`),
      fetch(`${API_URL}/students/${dbId}/courses`),
    ]);
    const allCatalog = await catRes.json();
    const studentHistory = await stuRes.json();
    const enrolledCodes = studentHistory.filter((c) => c.status === "enrolled").map((c) => c.code);
    const availableCourses = allCatalog.filter((c) => !enrolledCodes.includes(c.code));

    const inputEl = document.getElementById("adminAddCourseCode");
    let optionsHtml = `<option value="" disabled selected>Select Course to Enroll...</option>`;
    optionsHtml += availableCourses.map((c) => `<option value="${c.code}">${c.code} - ${c.name} (${c.credits} Cr)</option>`).join("");

    if (inputEl.tagName === "INPUT") {
      const select = document.createElement("select");
      select.id = "adminAddCourseCode";
      select.className = "admin-input";
      select.style.flex = "1";
      select.innerHTML = optionsHtml;
      inputEl.parentNode.replaceChild(select, inputEl);
    } else {
      inputEl.innerHTML = optionsHtml;
    }
  } catch (e) {
    console.error("Error loading available courses:", e);
  }
}

async function adminAddCourseToStudent() {
  const codeEl = document.getElementById("adminAddCourseCode");
  const code = codeEl.value;
  if (!code) return alert("Please select a course.");

  try {
    const res = await fetch(`${API_URL}/admin/student/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentDbId: currentEditingStudentId,
        courseCode: code,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Course Added!");
      loadAdminStudentCourses(currentEditingStudentId);
    } else alert("Error: " + data.error);
  } catch (e) {
    alert("Failed to add course.");
  }
}

async function adminDropCourse(courseId) {
  if (!confirm("Drop this course for the student?")) return;
  await fetch(`${API_URL}/admin/student/drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentDbId: currentEditingStudentId, type: "course", targetId: courseId }),
  });
  loadAdminStudentCourses(currentEditingStudentId);
}

async function adminDropSemesterForStudent() {
  if (!confirm("Drop ENTIRE SEMESTER?")) return;
  await fetch(`${API_URL}/admin/student/drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentDbId: currentEditingStudentId, type: "semester" }),
  });
  alert("Semester Dropped.");
  loadAdminStudentCourses(currentEditingStudentId);
}

async function adminDropSemester(dbId) {
  if (!confirm("Drop Semester?")) return;
  await fetch(`${API_URL}/admin/student/drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentDbId: dbId, type: "semester" }),
  });
  alert("Dropped.");
  loadStudents();
}

// =========================================================
// 5. MANAGE COURSES (UPDATED FOR DB SCHEDULES)
// =========================================================

async function loadAdminCourses() {
  try {
    const res = await fetch(`${API_URL}/admin/courses`);
    const courses = await res.json();
    const tbody = document.getElementById("courseList");

    if (courses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No courses defined.</td></tr>';
      return;
    }

    tbody.innerHTML = courses.map(c => {
      const percentage = c.max_students > 0 ? Math.round((c.enrolled_count / c.max_students) * 100) : 100;
      const statusColor = percentage >= 100 ? 'red' : (percentage >= 80 ? 'orange' : 'green');

      // Format Theory
      let scheduleDisplay = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="background:#e0e7ff; color:#4338ca; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.85em;">${c.theory_days}</span>
                    <span style="font-size:0.9em;">${c.theory_time}</span>
                </div>
            `;

      // Format Lab (if exists)
      if (c.lab_day && c.lab_time) {
        scheduleDisplay += `
                    <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                        <span style="background:#fef3c7; color:#b45309; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:0.85em;">Lab</span>
                        <span style="font-size:0.85em;">${c.lab_day} ${c.lab_time}</span>
                    </div>
                `;
      }

      return `
            <tr>
                <td style="vertical-align:middle;"><strong>${c.code}</strong></td>
                <td style="vertical-align:middle;">${c.name}</td>
                <td style="vertical-align:middle;">${scheduleDisplay}</td>
                <td style="vertical-align:middle;">
                    <span style="color:${statusColor}; font-weight:bold;">${c.enrolled_count} / ${c.max_students}</span>
                </td>
                <td style="vertical-align:middle;">
                    <div style="display:flex; gap:10px;">
                        <button onclick="editSeatCapacity(${c.id}, ${c.max_students}, '${c.code}')" style="cursor:pointer; border:none; background:none; color:#4F46E5;" title="Edit Seats"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteCourse(${c.id})" style="cursor:pointer; border:none; background:none; color:#dc2626;" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
            `;
    }).join("");
  } catch (e) {
    console.error(e);
  }
}

// --- HELPER: PARSE TIME TO MINUTES ---
// Accepts: "08:30", "8:30", "08:30:00", "Slot 1: 08:30 - 10:00"
function parseTimeRange(timeStr) {
  if (!timeStr) return null;

  // 1. Clean up "Slot X:" prefix
  let range = timeStr.includes("Slot") ? timeStr.split(":")[1] : timeStr;
  range = range.trim(); // e.g. "08:30 - 10:00"

  // 2. Split Start and End
  const parts = range.split("-");
  if (parts.length !== 2) return null;

  const [s, e] = parts.map(t => t.trim());

  // 3. Convert to Minutes (e.g. "08:30" -> 510)
  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return (h * 60) + (m || 0);
  };

  return { start: toMin(s), end: toMin(e) };
}

// --- HELPER: CHECK SCHEDULE CONFLICTS ---
function validateScheduleConflict(theoryDaysCode, theoryTimeStr, labDay, labTimeStr) {
  console.log(`Checking Conflict: ${theoryDaysCode} ${theoryTimeStr} vs ${labDay} ${labTimeStr}`);

  // 1. Map Theory Codes to Days
  const theoryMap = {
    "MW": ["Mon", "Wed", "Monday", "Wednesday", "M", "W"],
    "ST": ["Sun", "Tue", "Sunday", "Tuesday", "S", "T"],
    "SR": ["Sun", "Thu", "Sunday", "Thursday", "S", "R"],
    "TR": ["Tue", "Thu", "Tuesday", "Thursday", "T", "R"]
  };

  const activeDays = theoryMap[theoryDaysCode] || [];

  // 2. Normalize Lab Day (Handle "Mon", "Monday", "M")
  const cleanLabDay = labDay.trim();

  // If Lab Day is NOT in the Theory Days list, they can't clash.
  // Example: Theory on Mon/Wed, Lab on Tue -> Safe.
  const isDayMatch = activeDays.some(d => d.startsWith(cleanLabDay) || cleanLabDay.startsWith(d));
  if (!isDayMatch) return true;

  // 3. Check Time Overlap
  const t = parseTimeRange(theoryTimeStr);
  const l = parseTimeRange(labTimeStr);

  if (!t || !l) {
    console.error("Invalid time format detected");
    return true; // Skip check if invalid
  }

  // Overlap Logic: (Start A < End B) AND (End A > Start B)
  if (t.start < l.end && t.end > l.start) {
    console.warn("Conflict Detected!");
    return false; // FAIL
  }

  return true; // PASS
}

// --- MAIN ADD COURSE FUNCTION ---
async function addCourse(e) {
  e.preventDefault();

  // 1. Validate Instructor
  const instructorSelect = document.getElementById("cInstructor");
  if (!instructorSelect.value) return alert("Please select a valid instructor.");

  const credits = document.getElementById("cCredits").value;
  const sectionVal = document.getElementById("cSection").value;

  // 2. Validate Schedule (Time Clash Check)
  if (credits === "4" || credits === "4.5") {
    const tDays = document.getElementById("cTheoryDays").value;
    const tTime = document.getElementById("cTheoryTime").value;
    const lDay = document.getElementById("cLabDay").value;
    const lTime = document.getElementById("cLabTime").value;

    const isValid = validateScheduleConflict(tDays, tTime, lDay, lTime);

    if (!isValid) {
      alert(`🚫 SCHEDULE CLASH DETECTED!\n\nYou cannot schedule the Lab on ${lDay} at ${lTime}\nbecause it overlaps with the Theory class (${tDays} at ${tTime}).\n\nPlease choose a different Lab time or day.`);
      return; // STOP EXECUTION
    }
  }

  // 3. Prepare Data Object
  const body = {
    code: document.getElementById("cCode").value.trim(),
    name: document.getElementById("cName").value.trim(),
    section: parseInt(sectionVal) || 1, // Ensure integer
    department: document.getElementById("cDept").value,
    credits: Number(credits),
    instructor: instructorSelect.value,
    // Generate a mock email or use one from DB if available
    instructor_email: `${instructorSelect.value.split(' ')[0].toLowerCase()}@san.edu`,
    room_number: document.getElementById("cRoom").value,
    semester: "Fall-2025",

    // Schedule Data
    theory_days: document.getElementById("cTheoryDays").value,
    theory_time: document.getElementById("cTheoryTime").value,
    lab_day: (credits === "4" || credits === "4.5") ? document.getElementById("cLabDay").value : null,
    lab_time: (credits === "4" || credits === "4.5") ? document.getElementById("cLabTime").value : null
  };

  console.log("Sending Course Data:", body);

  // 4. Send to Server
  try {
    const res = await fetch(`${API_URL}/admin/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      alert("✅ Course Created Successfully!");
      e.target.reset(); // Clear Form

      // Reset UI States
      document.getElementById("cSection").value = "1";
      document.getElementById("labSection").style.display = "none";
      document.getElementById("cInstructor").innerHTML = "<option>Select Dept First</option>";
      document.getElementById("cInstructor").disabled = true;

      loadAdminCourses(); // Refresh Table
    } else {
      // Handle Duplicate Section Error or other DB errors
      alert("❌ Save Failed: " + (data.error || "Unknown database error"));
    }
  } catch (error) {
    console.error(error);
    alert("Connection Error: " + error.message);
  }
}

// --- DISPLAY COURSES (With Percentage & Section) ---
async function loadAdminCourses() {
  try {
    const res = await fetch(`${API_URL}/admin/courses`);
    const courses = await res.json();
    const tbody = document.getElementById("courseList");

    if (courses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No courses defined.</td></tr>';
      return;
    }

    tbody.innerHTML = courses.map(c => {
      // PERCENTAGE LOGIC
      const total = c.max_students || 40;
      const filled = c.enrolled_count || 0;
      const pct = Math.round((filled / total) * 100);

      // Color Logic
      let color = '#10b981'; // Green (Safe)
      if (pct > 80) color = '#f59e0b'; // Orange (Filling up)
      if (pct >= 100) color = '#ef4444'; // Red (Full)

      // Progress Bar HTML
      const progressHTML = `
                <div style="width: 100%; max-width: 120px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.8em; margin-bottom:3px;">
                        <span style="font-weight:bold; color:${color}">${filled} / ${total}</span>
                        <span style="color:#6b7280;">${pct}%</span>
                    </div>
                    <div style="width:100%; background:#e5e7eb; height:6px; border-radius:3px; overflow:hidden;">
                        <div style="width:${pct}%; background:${color}; height:100%;"></div>
                    </div>
                </div>
            `;

      // Schedule Formatting
      let scheduleDisplay = `<div><strong>${c.theory_days}</strong> ${c.theory_time}</div>`;
      if (c.lab_day && c.lab_time) {
        scheduleDisplay += `<div style="font-size:0.8em; color:#4F46E5; margin-top:2px;">Lab: ${c.lab_day} ${c.lab_time}</div>`;
      }

      return `
            <tr>
                <td>
                    <div style="font-weight:bold;">${c.code}</div>
                    <div style="font-size:0.8em; color:#6b7280;">Section ${c.section}</div>
                </td>
                <td>${c.name}</td>
                <td>${scheduleDisplay}</td>
                <td>
                    ${progressHTML}
                    <button onclick="editSeatCapacity(${c.id}, ${c.max_students}, '${c.code}')" 
                        style="font-size:0.7em; margin-top:5px; border:none; background:none; color:#4F46E5; cursor:pointer; text-decoration:underline;">
                        Adjust Capacity
                    </button>
                </td>
                <td>
                    <button onclick="deleteCourse(${c.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
            `;
    }).join("");
  } catch (e) {
    console.error(e);
  }
}

async function editSeatCapacity(id, currentMax, code) {
  const newMax = prompt(`Enter new total capacity for ${code}:`, currentMax);
  if (newMax !== null && newMax !== "") {
    const maxInt = parseInt(newMax);
    if (isNaN(maxInt) || maxInt < 0) return alert("Please enter a valid number.");

    try {
      const res = await fetch(`${API_URL}/admin/courses/${id}/capacity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_students: maxInt })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadAdminCourses();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Connection error");
    }
  }
}

async function deleteCourse(id) {
  if (!confirm("Delete this course completely? This will remove all student enrollments associated with it.")) return;
  try {
    await fetch(`${API_URL}/admin/courses/${id}`, { method: 'DELETE' });
    loadAdminCourses();
  } catch (e) { console.error(e); }
}

// =========================================================
// 6. UPLOAD GRADES
// =========================================================
async function uploadGrade(e) {
  e.preventDefault();
  const body = {
    studentId: document.getElementById("gStudentId").value,
    courseCode: document.getElementById("gCourseCode").value,
    grade: document.getElementById("gGrade").value,
    semester: document.getElementById("gSemester").value,
  };
  const res = await fetch(`${API_URL}/admin/grades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  alert(data.success ? "Grade Updated!" : "Error: " + data.error);
}

// =========================================================
// 7. SEMESTERS
// =========================================================
async function addSemester(e) {
  e.preventDefault();
  const body = {
    semester: document.getElementById("semName").value,
    start_date: document.getElementById("semStart").value,
    end_date: document.getElementById("semEnd").value,
  };
  await fetch(`${API_URL}/admin/semesters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  alert("Semester Opened!");
}

// =========================================================
// 8. ADVISING SLOTS (Gatekeeper)
// =========================================================
async function loadSlots() {
  const res = await fetch(`${API_URL}/admin/slots`);
  const slots = await res.json();
  const tbody = document.getElementById("slotsList");

  tbody.innerHTML = slots.map(s => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    const now = new Date();
    const isActive = now >= start && now <= end;
    const status = isActive ? '<span style="color:green; font-weight:bold;">Active Now</span>' : (now < start ? '<span style="color:orange;">Upcoming</span>' : '<span style="color:gray;">Expired</span>');

    return `
<tr>
    <td>${s.min_credits} - ${s.max_credits} Cr</td>
      <td>${start.toLocaleString()}</td>
      <td>${end.toLocaleString()}</td>
      <td>${status}</td>
 <td><button onclick="deleteSlot(${s.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button></td>
</tr>
`;
  }).join('');
}

async function addSlot(e) {
  e.preventDefault();
  const body = {
    min: document.getElementById("slotMin").value,
    max: document.getElementById("slotMax").value,
    start: document.getElementById("slotStart").value,
    end: document.getElementById("slotEnd").value
  };
  await fetch(`${API_URL}/admin/slots`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  alert("Time Slot Created!");
  loadSlots();
  e.target.reset();
}

async function deleteSlot(id) {
  if (!confirm("Remove this time slot?")) return;
  await fetch(`${API_URL}/admin/slots/${id}`, { method: 'DELETE' });
  loadSlots();
}

// =========================================================
// 9. ANNOUNCEMENTS
// =========================================================
async function postAnnouncement(e) {
  e.preventDefault();
  const body = {
    title: document.getElementById("aTitle").value,
    content: document.getElementById("aContent").value,
    category: document.getElementById("aCategory").value,
  };
  await fetch(`${API_URL}/admin/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  alert("Posted!");
  e.target.reset();
}


// =========================================================
// 10. FINANCIALS (FIXED: credits -> total_credits)
// =========================================================
async function loadFinancials() {
  try {
    const res = await fetch(`${API_URL}/admin/financials`);
    const data = await res.json();

    const tbody = document.getElementById("financialsList");

    tbody.innerHTML = `
            <table style="width:100%; border-collapse: collapse; font-size: 0.9em;">
                <thead>
                    <tr style="background:#f8fafc; text-align:left; border-bottom:2px solid #e2e8f0;">
                        <th style="padding:12px;">Student</th>
                        <th style="padding:12px;">Credits</th>
                        <th style="padding:12px; color:#64748b;">Prev. Due</th>
                        <th style="padding:12px; color:#64748b;">Current Sem</th>
                        <th style="padding:12px; font-weight:800;">Total Payable</th>
                        <th style="padding:12px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map((r) => {
      const isPaid = r.payment_status === 'Paid';
      // If paid, visual total is usually 0 effectively, but let's show what was paid or 0
      // Since we wipe previous_due on payment, total_payable will drop to just current charges or 0 depending on logic.
      // Ideally, if Paid, show $0 or "Cleared".
      const displayTotal = isPaid ? "$0.00" : `$${r.total_payable}`;
      const displayPrev = isPaid ? "$0" : `$${r.previous_due}`;

      // Status Dropdown Colors
      const bg = isPaid ? '#dcfce7' : '#ffedd5';
      const txt = isPaid ? '#166534' : '#9a3412';

      return `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px;">
                                <div style="font-weight:600;">${r.student_id}</div>
                                <div style="font-size:0.85em; color:#64748b;">${r.name}</div>
                            </td>
                            <td style="padding:12px; font-weight:bold;">${r.total_credits}</td>
                            <td style="padding:12px; color:#dc2626;">${displayPrev}</td>
                            <td style="padding:12px;">$${r.current_charges}</td>
                            <td style="padding:12px; font-weight:900; color:#1e293b; font-size:1.1em;">
                                ${displayTotal}
                            </td>
                            <td style="padding:12px;">
                                <select 
                                    onchange="updateFinancialStatus('${r.student_id}', this.value)"
                                    style="padding: 6px; border-radius: 6px; border:1px solid #cbd5e1; background:${bg}; color:${txt}; font-weight:600; cursor:pointer;"
                                >
                                    <option value="Due" ${r.payment_status === 'Due' ? 'selected' : ''}>Due</option>
                                    <option value="Paid" ${r.payment_status === 'Paid' ? 'selected' : ''}>Paid (Clear)</option>
                                    <option value="Refunded" ${r.payment_status === 'Refunded' ? 'selected' : ''}>Refunded</option>
                                </select>
                            </td>
                        </tr>
                        `;
    }).join("")}
                </tbody>
            </table>
        `;
  } catch (e) {
    console.error("Error loading financials:", e);
    document.getElementById("financialsList").innerHTML = "<p style='color:red; text-align:center;'>Failed to load financial data.</p>";
  }
}

// Function triggered when dropdown changes
async function updateFinancialStatus(studentId, newStatus) {
  if (newStatus === 'Paid' && !confirm("Marking as PAID will clear the Previous Due balance. Proceed?")) {
    loadFinancials(); // Revert UI selection
    return;
  }

  try {
    const res = await fetch(`${API_URL}/admin/financials/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, status: newStatus }),
    });

    const data = await res.json();
    if (data.success) {
      loadFinancials(); // Reload to see the balance update to $0
    } else {
      alert("Update failed: " + data.error);
    }
  } catch (e) {
    alert("Connection Error");
  }
}

// =========================================================
// 11. ADD ADMIN
// =========================================================
async function addAdmin(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById("admName").value,
    email: document.getElementById("admEmail").value,
    password: document.getElementById("admPassword").value,
  };
  const res = await fetch(`${API_URL}/admin/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.success) {
    alert("Admin Created!");
    e.target.reset();
  } else alert("Error: " + data.error);
}