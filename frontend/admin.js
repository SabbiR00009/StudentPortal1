const API_URL = "http://localhost:3000/api";
let currentEditingStudentId = null;
let scheduleConfig = [];

// =========================================================
// INITIALIZATION
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial Data Load
  loadStudents();
  loadFacultyForDropdowns();
  loadScheduleConfig();

  // 2. Event Listeners
  document.getElementById("addCourseForm").addEventListener("submit", addCourse);
  // Note: Grade form listener removed because we use the new Smart Interface
  document.getElementById("announcementForm").addEventListener("submit", postAnnouncement);
  document.getElementById("addSemesterForm").addEventListener("submit", addSemester);
  document.getElementById("newStudentForm").addEventListener("submit", registerStudent);
  document.getElementById("addAdminForm").addEventListener("submit", addAdmin);
  document.getElementById("editStudentForm").addEventListener("submit", updateStudentProfile);

  const facultyForm = document.getElementById("newFacultyForm");
  if (facultyForm) facultyForm.addEventListener("submit", registerFaculty);

  const slotForm = document.getElementById("addSlotForm");
  if (slotForm) slotForm.addEventListener("submit", addSlot);

  // 3. Navigation Logic
  const adminLogo = document.getElementById("adminNavLogo");
  if (adminLogo) {
    adminLogo.addEventListener("click", () => {
      const overviewBtn = document.querySelector('.nav-btn[onclick*="overview"]');
      switchAdminView("overview", overviewBtn);
    });
  }
  const dropForm = document.getElementById("dropScheduleForm");
  if (dropForm) {
    dropForm.addEventListener("submit", setDropSchedule);
    loadDropSchedule(); // Load data when page opens
  }
  setupAdminAvatar();
});


// =========================================================
// DROP SCHEDULE LOGIC
// =========================================================

async function setDropSchedule(e) {
  e.preventDefault();

  const body = {
    semester: document.getElementById("dropSemester").value,
    start: document.getElementById("dropStart").value,
    end: document.getElementById("dropEnd").value
  };

  try {
    const res = await fetch(`${API_URL}/admin/drop-schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.success) {
      alert("✅ Drop Window Updated Successfully!");
      loadDropSchedule();
    } else {
      alert("Error: " + data.error);
    }
  } catch (e) {
    alert("Connection Failed");
  }
}

async function loadDropSchedule() {
  try {
    const res = await fetch(`${API_URL}/admin/drop-schedule`);
    const data = await res.json();

    const display = document.getElementById("currentDropWindow");
    const badge = document.getElementById("dropStatusBadge");

    if (data) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const now = new Date();
      const isActive = now >= start && now <= end;

      // Update Text
      display.innerHTML = `
                <strong>Active Window:</strong> 
                ${start.toLocaleString()} — ${end.toLocaleString()}
            `;

      // Update Badge Color
      if (isActive) {
        badge.style.background = "#dcfce7";
        badge.style.color = "#166534";
        badge.innerText = "OPEN NOW";
      } else {
        badge.style.background = "#fee2e2";
        badge.style.color = "#991b1b";
        badge.innerText = "CLOSED";
      }

    } else {
      display.innerHTML = "No drop schedule set.";
      badge.innerText = "NOT SET";
    }
  } catch (e) { console.error(e); }
}
// =========================================================
// HELPER FUNCTIONS
// =========================================================

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
  } catch (e) { console.error("Error loading faculty:", e); }
}

async function loadScheduleConfig() {
  try {
    const res = await fetch(`${API_URL}/admin/config/schedules`);
    scheduleConfig = await res.json();

    const daySelect = document.getElementById("cTheoryDays");
    if (daySelect) daySelect.innerHTML = scheduleConfig.filter(r => r.category === 'theory_day').map(r => `<option value="${r.value}">${r.display}</option>`).join("");

    const timeSelect = document.getElementById("cTheoryTime");
    if (timeSelect) timeSelect.innerHTML = scheduleConfig.filter(r => r.category === 'theory_slot').map(r => `<option value="${r.value}">${r.display}</option>`).join("");

    const labDaySelect = document.getElementById("cLabDay");
    if (labDaySelect) labDaySelect.innerHTML = scheduleConfig.filter(r => r.category === 'lab_day').map(r => `<option value="${r.value}">${r.display}</option>`).join("");
  } catch (e) { console.error("Error loading schedule config:", e); }
}

function handleCreditChange() {
  const credits = document.getElementById("cCredits").value;
  const labSection = document.getElementById("labSection");
  const labTimeSelect = document.getElementById("cLabTime");

  labTimeSelect.innerHTML = "";

  if (credits === "4" || credits === "4.5") {
    labSection.style.display = "block";
    document.getElementById("cLabDay").required = true;
    document.getElementById("cLabTime").required = true;

    const category = (credits === "4") ? 'lab_slot_2h' : 'lab_slot_3h';
    const slots = scheduleConfig.filter(r => r.category === category);
    labTimeSelect.innerHTML = slots.map(r => `<option value="${r.value}">${r.display}</option>`).join("");
  } else {
    labSection.style.display = "none";
    document.getElementById("cLabDay").required = false;
    document.getElementById("cLabTime").required = false;
  }
}

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
  } catch (e) { instSelect.innerHTML = '<option>Error loading</option>'; }
}

function parseTimeRange(timeStr) {
  if (!timeStr) return null;
  let range = timeStr.includes("Slot") ? timeStr.split(":")[1] : timeStr;
  range = range.trim();
  const parts = range.split("-");
  if (parts.length !== 2) return null;
  const [s, e] = parts.map(t => t.trim());
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return (h * 60) + (m || 0); };
  return { start: toMin(s), end: toMin(e) };
}

function validateScheduleConflict(theoryDaysCode, theoryTimeStr, labDay, labTimeStr) {
  const theoryMap = {
    "MW": ["Mon", "Wed", "Monday", "Wednesday", "M", "W"],
    "ST": ["Sun", "Tue", "Sunday", "Tuesday", "S", "T"],
    "SR": ["Sun", "Thu", "Sunday", "Thursday", "S", "R"],
    "TR": ["Tue", "Thu", "Tuesday", "Thursday", "T", "R"]
  };
  const activeDays = theoryMap[theoryDaysCode] || [];
  const cleanLabDay = labDay.trim();
  const isDayMatch = activeDays.some(d => d.startsWith(cleanLabDay) || cleanLabDay.startsWith(d));
  if (!isDayMatch) return true;

  const t = parseTimeRange(theoryTimeStr);
  const l = parseTimeRange(labTimeStr);
  if (!t || !l) return true;

  if (t.start < l.end && t.end > l.start) return false;
  return true;
}

// =========================================================
// UI & NAV
// =========================================================
function setupAdminAvatar() {
  const adminData = JSON.parse(sessionStorage.getItem('adminUser'));
  const avatarEl = document.querySelector('.navbar .user-avatar');
  if (adminData && avatarEl) {
    document.getElementById("adminName").innerText = adminData.name;
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
// 1. STUDENTS
// =========================================================
async function loadStudents() {
  const searchInput = document.getElementById("studentSearch");
  const searchTerm = searchInput ? searchInput.value : "";
  const url = searchTerm ? `${API_URL}/admin/students?search=${encodeURIComponent(searchTerm)}` : `${API_URL}/admin/students`;

  try {
    const res = await fetch(url);
    const students = await res.json();
    const tbody = document.getElementById("studentList");

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #666;">No students found.</td></tr>';
      return;
    }

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
                        <button onclick="openEditStudentModal('${s.student_id}', ${s.id})" class="action-btn" title="Edit"><i class="fas fa-edit" style="color:#4F46E5;"></i></button>
                        <button onclick="deleteStudent('${s.student_id}')" class="action-btn" title="Delete"><i class="fas fa-trash" style="color:#dc2626;"></i></button>
                    </div>
                </td>
            </tr>
        `).join("");
  } catch (e) { console.error("Error loading students:", e); }
}

function searchStudents() { loadStudents(); }
function openAddStudentModal() { document.getElementById("studentModal").style.display = "flex"; }

async function registerStudent(e) {
  e.preventDefault();
  const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : "";
  const advSelect = document.getElementById("nsAdvisorSelect");
  let advName = "Not Assigned", advEmail = "";

  if (advSelect.selectedIndex > 0) {
    advEmail = advSelect.value;
    advName = advSelect.options[advSelect.selectedIndex].getAttribute("data-name");
  }

  const body = {
    name: getVal("nsName"), phone: getVal("nsPhone"), department: getVal("nsDept"),
    admitted_year: getVal("nsYear"), admitted_semester: getVal("nsSem"), program: getVal("nsProgram"),
    advisor_name: advName, advisor_email: advEmail,
  };

  try {
    const res = await fetch(`${API_URL}/admin/students`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      document.getElementById("studentModal").style.display = "none";
      e.target.reset();
      loadStudents();
    } else alert("Error: " + (data.error || data.message));
  } catch (err) { alert("Connection Error"); }
}

async function deleteStudent(studentId) {
  if (!confirm(`Permanently delete student ${studentId}?`)) return;
  await fetch(`${API_URL}/admin/students/${studentId}`, { method: "DELETE" });
  loadStudents();
}

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
  if (s.advisor_email) advSelect.value = s.advisor_email;
  else advSelect.value = "";

  loadAdminStudentCourses(dbId);
  document.getElementById("editStudentModal").style.display = "flex";
}

async function updateStudentProfile(e) {
  e.preventDefault();
  const studentId = document.getElementById("editStudentId").value;
  const advSelect = document.getElementById("editAdvisorSelect");
  let advName = null, advEmail = null;

  if (advSelect.value) {
    advEmail = advSelect.value;
    const selectedOption = advSelect.querySelector(`option[value="${advEmail}"]`);
    if (selectedOption) advName = selectedOption.getAttribute("data-name");
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
    advisor_name: advName, advisor_email: advEmail,
  };

  try {
    const res = await fetch(`${API_URL}/admin/students/${studentId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      alert("✅ Profile Updated!");
      document.getElementById("editStudentModal").style.display = "none";
      loadStudents();
    } else alert("❌ Update Failed: " + data.error);
  } catch (e) { alert("Connection Error"); }
}

// =========================================================
// 2. FACULTY
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
    const res = await fetch(`${API_URL}/admin/faculty`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      document.getElementById("facultyModal").style.display = 'none';
      e.target.reset();
      loadFaculty();
    } else alert("Error: " + data.error);
  } catch (err) { alert("Connection Error"); }
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
}

// =========================================================
// 3. COURSES (ADD, DELETE, CONFLICT CHECK)
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
      const total = c.max_students || 40;
      const filled = c.enrolled_count || 0;
      const pct = Math.round((filled / total) * 100);
      let color = '#10b981';
      if (pct > 80) color = '#f59e0b';
      if (pct >= 100) color = '#ef4444';

      let scheduleDisplay = `<div><strong>${c.theory_days}</strong> ${c.theory_time}</div>`;
      if (c.lab_day && c.lab_time) scheduleDisplay += `<div style="font-size:0.8em; color:#4F46E5;">Lab: ${c.lab_day} ${c.lab_time}</div>`;

      return `
            <tr>
                <td><div style="font-weight:bold;">${c.code}</div><div style="font-size:0.8em; color:#6b7280;">Section ${c.section}</div></td>
                <td>${c.name}</td>
                <td>${scheduleDisplay}</td>
                <td>
                    <div style="width: 100%; max-width: 120px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.8em;">
                            <span style="font-weight:bold; color:${color}">${filled} / ${total}</span>
                            <span style="color:#6b7280;">${pct}%</span>
                        </div>
                        <div style="width:100%; background:#e5e7eb; height:6px; border-radius:3px; overflow:hidden;">
                            <div style="width:${pct}%; background:${color}; height:100%;"></div>
                        </div>
                    </div>
                    <button onclick="editSeatCapacity(${c.id}, ${c.max_students}, '${c.code}')" style="font-size:0.7em; border:none; background:none; color:#4F46E5; cursor:pointer; text-decoration:underline;">Adjust Capacity</button>
                </td>
                <td><button onclick="deleteCourse(${c.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button></td>
            </tr>`;
    }).join("");
  } catch (e) { console.error(e); }
}

async function addCourse(e) {
  e.preventDefault();
  const instructorSelect = document.getElementById("cInstructor");
  if (!instructorSelect.value) return alert("Please select a valid instructor.");

  const credits = document.getElementById("cCredits").value;
  const sectionVal = document.getElementById("cSection").value;

  if (credits === "4" || credits === "4.5") {
    if (!validateScheduleConflict(document.getElementById("cTheoryDays").value, document.getElementById("cTheoryTime").value, document.getElementById("cLabDay").value, document.getElementById("cLabTime").value)) {
      return alert(`🚫 SCHEDULE CLASH DETECTED!`);
    }
  }

  const body = {
    code: document.getElementById("cCode").value.trim(),
    name: document.getElementById("cName").value.trim(),
    section: parseInt(sectionVal) || 1,
    department: document.getElementById("cDept").value,
    credits: Number(credits),
    instructor: instructorSelect.value,
    instructor_email: `${instructorSelect.value.split(' ')[0].toLowerCase()}@san.edu`,
    room_number: document.getElementById("cRoom").value,
    semester: "Fall-2025",
    theory_days: document.getElementById("cTheoryDays").value,
    theory_time: document.getElementById("cTheoryTime").value,
    lab_day: (credits === "4" || credits === "4.5") ? document.getElementById("cLabDay").value : null,
    lab_time: (credits === "4" || credits === "4.5") ? document.getElementById("cLabTime").value : null
  };

  try {
    const res = await fetch(`${API_URL}/admin/courses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) {
      alert("✅ Course Created!");
      e.target.reset();
      document.getElementById("cSection").value = "1";
      document.getElementById("labSection").style.display = "none";
      loadAdminCourses();
    } else alert("❌ Save Failed: " + data.error);
  } catch (error) { alert("Connection Error"); }
}

async function deleteCourse(id) {
  if (!confirm("Delete this course completely?")) return;
  await fetch(`${API_URL}/admin/courses/${id}`, { method: 'DELETE' });
  loadAdminCourses();
}

async function editSeatCapacity(id, currentMax, code) {
  const newMax = prompt(`Enter new capacity for ${code}:`, currentMax);
  if (newMax) {
    await fetch(`${API_URL}/admin/courses/${id}/capacity`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ max_students: parseInt(newMax) }) });
    loadAdminCourses();
  }
}

// =========================================================
// 4. SMART GRADES (SEARCH, CALC, BATCH)
// =========================================================
async function searchStudentForGrades() {
  const input = document.getElementById("gradeStudentSearch");
  const query = input.value.trim();
  const resultBox = document.getElementById("gradeSearchResults");

  if (query.length < 2) { resultBox.style.display = 'none'; return; }

  try {
    const res = await fetch(`${API_URL}/admin/grades/search-student?q=${query}`);
    const students = await res.json();
    if (students.length > 0) {
      resultBox.innerHTML = students.map(s => `<div class="search-item" onclick="selectStudentForGrades(${s.id}, '${s.name}', '${s.student_id}')"><strong>${s.student_id}</strong> - ${s.name} (${s.department})</div>`).join("");
      resultBox.style.display = 'block';
    } else resultBox.style.display = 'none';
  } catch (e) { console.error(e); }
}

async function selectStudentForGrades(dbId, name, studentId) {
  document.getElementById("gradeStudentSearch").value = studentId;
  document.getElementById("selectedStudentName").value = name;
  document.getElementById("selectedStudentDbId").value = dbId;
  document.getElementById("gradeSearchResults").style.display = 'none';

  try {
    const res = await fetch(`${API_URL}/admin/grades/pending-courses/${dbId}`);
    const courses = await res.json();
    const tbody = document.getElementById("gradeEntryTable");
    const section = document.getElementById("gradeEntrySection");

    if (courses.length === 0) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No pending courses found.</td></tr>`;
    else {
      tbody.innerHTML = courses.map(c => `
                <tr class="grade-row" data-course-id="${c.course_id}">
                    <td><strong>${c.code}</strong><br><span style="font-size:0.8em; color:#666;">${c.name} (Sec ${c.section})</span></td>
                    <td>${c.credits}</td>
                    <td><input type="number" class="marks-input" min="0" max="100" placeholder="0" oninput="calculateGradeForRow(this)" style="width:80px; padding:5px; text-align:center;"></td>
                    <td class="grade-display" style="font-weight:bold;">-</td>
                    <td class="gpa-display">-</td>
                </tr>`).join("");
    }
    section.style.display = 'block';
  } catch (e) { alert("Error loading courses"); }
}

function calculateGradeForRow(input) {
  const row = input.closest('tr');
  const marks = parseInt(input.value);
  let grade = "F", point = 0.0;

  if (!isNaN(marks)) {
    if (marks >= 80) { grade = "A+"; point = 4.00; }
    else if (marks >= 75) { grade = "A"; point = 3.75; }
    else if (marks >= 70) { grade = "A-"; point = 3.50; }
    else if (marks >= 65) { grade = "B+"; point = 3.25; }
    else if (marks >= 60) { grade = "B"; point = 3.00; }
    else if (marks >= 55) { grade = "B-"; point = 2.75; }
    else if (marks >= 50) { grade = "C+"; point = 2.50; }
    else if (marks >= 45) { grade = "C"; point = 2.25; }
    else if (marks >= 40) { grade = "D"; point = 2.00; }
  }

  const gradeEl = row.querySelector('.grade-display');
  gradeEl.innerText = isNaN(marks) ? "-" : grade;
  gradeEl.style.color = grade === 'F' ? 'red' : 'green';
  row.querySelector('.gpa-display').innerText = isNaN(marks) ? "-" : point.toFixed(2);
}

async function submitBatchGrades() {
  const studentId = document.getElementById("selectedStudentDbId").value;
  const rows = document.querySelectorAll(".grade-row");
  const gradesToSave = [];

  rows.forEach(row => {
    const marks = row.querySelector(".marks-input").value;
    if (marks !== "") {
      gradesToSave.push({
        courseId: row.getAttribute("data-course-id"),
        marks: parseInt(marks),
        grade: row.querySelector(".grade-display").innerText,
        point: parseFloat(row.querySelector(".gpa-display").innerText)
      });
    }
  });

  if (gradesToSave.length === 0) return alert("Please enter marks.");

  try {
    const res = await fetch(`${API_URL}/admin/grades/batch`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, grades: gradesToSave }) });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      document.getElementById("gradeEntrySection").style.display = 'none';
      document.getElementById("gradeStudentSearch").value = "";
      document.getElementById("selectedStudentName").value = "";
    } else alert("Error: " + data.error);
  } catch (e) { alert("Connection Error"); }
}

// =========================================================
// 5. FINANCIALS (ROLLING BALANCE)
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
      const displayTotal = isPaid ? "$0.00" : `$${r.total_payable}`;
      const displayPrev = isPaid ? "$0" : `$${r.previous_due}`;
      const bg = isPaid ? '#dcfce7' : '#ffedd5';
      const txt = isPaid ? '#166534' : '#9a3412';

      return `
                        <tr style="border-bottom:1px solid #f1f5f9;">
                            <td style="padding:12px;"><div style="font-weight:600;">${r.student_id}</div><div style="font-size:0.85em; color:#64748b;">${r.name}</div></td>
                            <td style="padding:12px; font-weight:bold;">${r.total_credits}</td>
                            <td style="padding:12px; color:#dc2626;">${displayPrev}</td>
                            <td style="padding:12px;">$${r.current_charges}</td>
                            <td style="padding:12px; font-weight:900; color:#1e293b; font-size:1.1em;">${displayTotal}</td>
                            <td style="padding:12px;">
                                <select onchange="updateFinancialStatus('${r.student_id}', this.value)" style="padding: 6px; border-radius: 6px; border:1px solid #cbd5e1; background:${bg}; color:${txt}; font-weight:600; cursor:pointer;">
                                    <option value="Due" ${r.payment_status === 'Due' ? 'selected' : ''}>Due</option>
                                    <option value="Paid" ${r.payment_status === 'Paid' ? 'selected' : ''}>Paid (Clear)</option>
                                    <option value="Refunded" ${r.payment_status === 'Refunded' ? 'selected' : ''}>Refunded</option>
                                </select>
                            </td>
                        </tr>`;
    }).join("")}
                </tbody>
            </table>`;
  } catch (e) { console.error(e); }
}

async function updateFinancialStatus(studentId, newStatus) {
  if (newStatus === 'Paid' && !confirm("Marking as PAID will clear the Previous Due balance. Proceed?")) {
    loadFinancials(); return;
  }
  await fetch(`${API_URL}/admin/financials/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, status: newStatus }) });
  loadFinancials();
}

// =========================================================
// 6. ENROLL/DROP/SEMESTERS/SLOTS/ADMINS
// =========================================================
async function loadAdminStudentCourses(dbId) {
  const res = await fetch(`${API_URL}/students/${dbId}/courses`);
  const courses = await res.json();
  const enrolled = courses.filter((c) => c.status === "enrolled");
  const listDiv = document.getElementById("adminStudentCoursesList");

  if (enrolled.length === 0) listDiv.innerHTML = '<p style="color:#666; font-style:italic; padding:10px; text-align:center;">No active courses.</p>';
  else {
    listDiv.innerHTML = `<table style="width:100%; font-size:0.9em; border-collapse: collapse;">
            ${enrolled.map((c) => `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;"><b>${c.code}</b></td><td style="padding:8px;">${c.name}</td><td style="text-align:right; padding:8px;"><button type="button" onclick="adminDropCourse(${c.id})" style="color:red; border:none; background:none; cursor:pointer;" title="Drop Course"><i class="fas fa-minus-circle"></i></button></td></tr>`).join("")}
        </table>`;
  }
  loadAdminAvailableCourses(dbId);
}

async function loadAdminAvailableCourses(dbId) {
  const [catRes, stuRes] = await Promise.all([fetch(`${API_URL}/advising/courses`), fetch(`${API_URL}/students/${dbId}/courses`)]);
  const allCatalog = await catRes.json();
  const studentHistory = await stuRes.json();
  const enrolledCodes = studentHistory.filter((c) => c.status === "enrolled").map((c) => c.code);
  const availableCourses = allCatalog.filter((c) => !enrolledCodes.includes(c.code));

  const inputEl = document.getElementById("adminAddCourseCode");
  const optionsHtml = `<option value="" disabled selected>Select Course to Enroll...</option>` + availableCourses.map((c) => `<option value="${c.code}">${c.code} - ${c.name} (${c.credits} Cr)</option>`).join("");

  if (inputEl.tagName === "INPUT") {
    const select = document.createElement("select");
    select.id = "adminAddCourseCode"; select.className = "admin-input"; select.style.flex = "1"; select.innerHTML = optionsHtml;
    inputEl.parentNode.replaceChild(select, inputEl);
  } else inputEl.innerHTML = optionsHtml;
}

async function adminAddCourseToStudent() {
  const codeEl = document.getElementById("adminAddCourseCode");
  const code = codeEl.value; // (Can be from input or select)

  if (!code) return alert("Please select a course code.");

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
      alert("✅ " + data.message);
      loadAdminStudentCourses(currentEditingStudentId);
      if (codeEl.tagName === 'INPUT') codeEl.value = ""; // Clear input
    } else {
      // SHOW SERVER ERROR (Conflict or Duplicate)
      alert("🚫 Enrollment Failed:\n" + data.error);
    }
  } catch (e) {
    alert("Failed to connect to server.");
  }
}

async function adminDropCourse(courseId) {
  if (!confirm("Drop this course for the student?")) return;
  await fetch(`${API_URL}/admin/student/drop`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentDbId: currentEditingStudentId, type: "course", targetId: courseId }) });
  loadAdminStudentCourses(currentEditingStudentId);
}

async function adminDropSemesterForStudent() {
  if (!confirm("Drop ENTIRE SEMESTER?")) return;
  await fetch(`${API_URL}/admin/student/drop`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentDbId: currentEditingStudentId, type: "semester" }) });
  alert("Semester Dropped."); loadAdminStudentCourses(currentEditingStudentId);
}

async function addSemester(e) {
  e.preventDefault();
  const body = { semester: document.getElementById("semName").value, start_date: document.getElementById("semStart").value, end_date: document.getElementById("semEnd").value };
  await fetch(`${API_URL}/admin/semesters`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  alert("Semester Opened!");
}

async function loadSlots() {
  const res = await fetch(`${API_URL}/admin/slots`);
  const slots = await res.json();
  document.getElementById("slotsList").innerHTML = slots.map(s => {
    const now = new Date(); const start = new Date(s.start_time); const end = new Date(s.end_time);
    const status = (now >= start && now <= end) ? '<span style="color:green;">Active</span>' : '<span style="color:gray;">Expired/Future</span>';
    return `<tr><td>${s.min_credits} - ${s.max_credits} Cr</td><td>${start.toLocaleString()}</td><td>${end.toLocaleString()}</td><td>${status}</td><td><button onclick="deleteSlot(${s.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button></td></tr>`;
  }).join('');
}

async function addSlot(e) {
  e.preventDefault();
  const body = { min: document.getElementById("slotMin").value, max: document.getElementById("slotMax").value, start: document.getElementById("slotStart").value, end: document.getElementById("slotEnd").value };
  await fetch(`${API_URL}/admin/slots`, { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  alert("Slot Created!"); loadSlots(); e.target.reset();
}

async function deleteSlot(id) {
  if (confirm("Remove slot?")) { await fetch(`${API_URL}/admin/slots/${id}`, { method: 'DELETE' }); loadSlots(); }
}

async function addAdmin(e) {
  e.preventDefault();
  const body = { name: document.getElementById("admName").value, email: document.getElementById("admEmail").value, password: document.getElementById("admPassword").value };
  await fetch(`${API_URL}/admin/admins`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  alert("Admin Created!"); e.target.reset();
}

async function postAnnouncement(e) {
  e.preventDefault();
  const body = { title: document.getElementById("aTitle").value, content: document.getElementById("aContent").value, category: document.getElementById("aCategory").value };
  await fetch(`${API_URL}/admin/announcements`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  alert("Posted!"); e.target.reset();
}