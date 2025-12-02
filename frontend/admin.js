const API_URL = "http://localhost:3000/api";
let currentEditingStudentId = null; // Tracks the DB ID of the student being edited

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initial Data Load
  loadStudents();

  // 2. Event Listeners for Forms
  document.getElementById("addCourseForm").addEventListener("submit", addCourse);
  document.getElementById("gradeForm").addEventListener("submit", uploadGrade);
  document.getElementById("announcementForm").addEventListener("submit", postAnnouncement);
  document.getElementById("addSemesterForm").addEventListener("submit", addSemester);
  document.getElementById("newStudentForm").addEventListener("submit", registerStudent);
  document.getElementById("addAdminForm").addEventListener("submit", addAdmin);
  document.getElementById("editStudentForm").addEventListener("submit", updateStudentProfile);
  
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

// --- ADMIN AVATAR & PROFILE LOGIC ---
function setupAdminAvatar() {
    // Get Admin data from Session Storage
    const adminData = JSON.parse(sessionStorage.getItem('adminUser'));
    const avatarEl = document.querySelector('.navbar .user-avatar');
    
    if (adminData && avatarEl) {
        // Update Name in Navbar
        const nameEl = document.getElementById("adminName");
        if(nameEl) nameEl.innerText = adminData.name;

        // Generate Image URL based on name
        const imgUrl = `https://ui-avatars.com/api/?name=${adminData.name}&background=dc2626&color=fff`;
        
        // Render Image in Navbar
        avatarEl.innerHTML = `<img src="${imgUrl}" alt="Admin">`;
        
        // Add Click Listener
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
  // Hide all views
  document.querySelectorAll(".view-section").forEach((el) => el.classList.remove("active"));
  // Deactivate all sidebar buttons
  document.querySelectorAll(".nav-btn").forEach((el) => el.classList.remove("active"));

  // Show target view
  const target = document.getElementById(`view-${viewName}`);
  if (target) target.classList.add("active");
  
  // Highlight sidebar button if it exists
  if (btn) btn.classList.add("active");

  // Load specific data
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

// --- 1. MANAGE STUDENTS ---
async function loadStudents() {
  const search = document.getElementById("studentSearch").value;
  const url = search
    ? `${API_URL}/admin/students?search=${search}`
    : `${API_URL}/admin/students`;

  try {
    const res = await fetch(url);
    const students = await res.json();
    const tbody = document.getElementById("studentList");

    if (students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No students found.</td></tr>';
      return;
    }

    tbody.innerHTML = students.map((s) => `
            <tr>
                <td><strong>${s.student_id}</strong></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td>${s.advisor_name || "None"}</td>
                <td>
                    <button onclick="openEditStudentModal('${s.student_id}', ${s.id})" class="action-btn" title="Edit" style="color:#4F46E5;"><i class="fas fa-edit"></i></button>
                    <button onclick="adminDropSemester(${s.id})" class="action-btn btn-delete" title="Drop Semester"><i class="fas fa-ban"></i></button>
                    <button onclick="deleteStudent('${s.student_id}')" class="action-btn btn-delete" title="Delete Student"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join("");
  } catch (e) {
    console.error(e);
  }
}

function searchStudents() {
  loadStudents();
}

function openAddStudentModal() {
  document.getElementById("studentModal").style.display = "flex";
}

async function registerStudent(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById("nsName").value,
    email: document.getElementById("nsEmail").value,
    phone: document.getElementById("nsPhone").value,
    
    // [UPDATED] Send ID Generation Data
    department: document.getElementById("nsDept").value,
    admitted_year: document.getElementById("nsYear").value,
    admitted_semester: document.getElementById("nsSem").value,

    // Advisor
    advisor_name: document.getElementById("nsAdvisor").value,
    advisor_email: document.getElementById("nsAdvisorEmail").value,
  };

  try {
    const res = await fetch(`${API_URL}/admin/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      alert(data.message); // e.g. "Student Created! ID: 2025-3-60-001"
      document.getElementById("studentModal").style.display = "none";
      e.target.reset();
      loadStudents();
    } else alert("Error: " + data.message);
  } catch (err) {
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

// --- EDIT STUDENT & COURSE MANAGEMENT LOGIC ---

async function openEditStudentModal(studentId, dbId) {
  currentEditingStudentId = dbId; // Store DB ID globally for course ops

  // 1. Fetch Student Details
  const res = await fetch(`${API_URL}/students/${dbId}`);
  const s = await res.json();

  // 2. Populate Form
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

  document.getElementById("editAdvisorName").value = s.advisor_name || "";
  document.getElementById("editAdvisorEmail").value = s.advisor_email || "";

  // 3. Load Enrolled Courses for this Student
  loadAdminStudentCourses(dbId);

  document.getElementById("editStudentModal").style.display = "flex";
}

async function updateStudentProfile(e) {
  e.preventDefault();
  const dbId = document.getElementById("editStudentDbId").value;
  const studentId = document.getElementById("editStudentId").value;

  const body = {
    name: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    phone: document.getElementById("editPhone").value,
    department: document.getElementById("editDept").value,
    program: document.getElementById("editProgram").value,
    year: document.getElementById("editYear").value,
    semester: document.getElementById("editSemester").value,
    dob: document.getElementById("editDob").value,
    blood_group: document.getElementById("editBlood").value,
    present_address: document.getElementById("editPresentAddr").value,
    advisor_name: document.getElementById("editAdvisorName").value,
    advisor_email: document.getElementById("editAdvisorEmail").value,
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

// --- ADMIN COURSE ACTIONS FOR STUDENT (Enroll/Drop Override) ---

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

  // Refresh the dropdown to exclude these enrolled courses
  loadAdminAvailableCourses(dbId);
}

async function loadAdminAvailableCourses(dbId) {
  try {
    const [catRes, stuRes] = await Promise.all([
      fetch(`${API_URL}/advising/courses`), // Gets all courses
      fetch(`${API_URL}/students/${dbId}/courses`),
    ]);
    const allCatalog = await catRes.json();
    const studentHistory = await stuRes.json();

    const enrolledCodes = studentHistory
      .filter((c) => c.status === "enrolled")
      .map((c) => c.code);

    // Filter out enrolled courses
    const availableCourses = allCatalog.filter(
      (c) => !enrolledCodes.includes(c.code)
    );

    const inputEl = document.getElementById("adminAddCourseCode");

    let optionsHtml = `<option value="" disabled selected>Select Course to Enroll...</option>`;
    optionsHtml += availableCourses.map(
        (c) => `<option value="${c.code}">${c.code} - ${c.name} (${c.credits} Cr)</option>`
      ).join("");

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
    } else {
      alert("Error: " + data.error);
    }
  } catch (e) {
    alert("Failed to add course.");
  }
}

async function adminDropCourse(courseId) {
  if (!confirm("Drop this course for the student?")) return;

  await fetch(`${API_URL}/admin/student/drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentDbId: currentEditingStudentId,
      type: "course",
      targetId: courseId,
    }),
  });
  loadAdminStudentCourses(currentEditingStudentId);
}

async function adminDropSemesterForStudent() {
  if (!confirm("Drop ENTIRE SEMESTER for this student?")) return;

  await fetch(`${API_URL}/admin/student/drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentDbId: currentEditingStudentId,
      type: "semester",
    }),
  });
  alert("Semester Dropped.");
  loadAdminStudentCourses(currentEditingStudentId);
}

async function adminDropSemester(dbId) {
  if (!confirm("Drop Semester for this student?")) return;
  await fetch(`${API_URL}/admin/student/drop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentDbId: dbId, type: "semester" }),
  });
  alert("Dropped.");
  loadStudents();
}

// --- 2. MANAGE FACULTY ---
async function loadFaculty() {
  const res = await fetch(`${API_URL}/admin/faculty`);
  const faculty = await res.json();
  const tbody = document.getElementById("facultyList");

  tbody.innerHTML = faculty.map((f) => `
        <tr>
            <td>${f.faculty_id}</td>
            <td>${f.name}</td>
            <td>${f.email}</td>
            <td>${f.department}</td>
            <td><button onclick="deleteFaculty(${f.id})" class="action-btn btn-delete"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join("");
}

function openAddFacultyModal() {
  const name = prompt("Faculty Name:");
  const email = prompt("Faculty Email:");
  if (name && email) {
    const id = "F" + Math.floor(Math.random() * 1000);
    fetch(`${API_URL}/admin/faculty`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        faculty_id: id,
        name,
        email,
        department: "General",
        designation: "Lecturer",
      }),
    }).then(() => {
      alert("Added!");
      loadFaculty();
    });
  }
}

async function deleteFaculty(id) {
  if (!confirm("Delete Faculty Member?")) return;
  await fetch(`${API_URL}/admin/faculty/${id}`, { method: "DELETE" });
  loadFaculty();
}

// --- 3. MANAGE COURSES (With Seat Control) ---

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
            // Safe div handling if max_students is 0
            const percentage = c.max_students > 0 ? Math.round((c.enrolled_count / c.max_students) * 100) : 100;
            const statusColor = percentage >= 100 ? 'red' : (percentage >= 80 ? 'orange' : 'green');
            
            return `
            <tr>
                <td><strong>${c.code}</strong></td>
                <td>${c.name}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span>${c.enrolled_count} / ${c.max_students}</span>
                        <button onclick="editSeatCapacity(${c.id}, ${c.max_students}, '${c.code}')" 
                                style="font-size:0.8em; padding:2px 8px; background:#e0e7ff; color:#4338ca; border:none; border-radius:4px; cursor:pointer;">
                            Edit
                        </button>
                    </div>
                </td>
                <td><span style="color:${statusColor}; font-weight:bold;">${percentage}% Full</span></td>
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

async function addCourse(e) {
  e.preventDefault();
  const body = {
    code: document.getElementById("cCode").value,
    name: document.getElementById("cName").value,
    
    // [UPDATED] Catch Department from Dropdown
    department: document.getElementById("cDept").value,
    
    credits: document.getElementById("cCredits").value,
    instructor: document.getElementById("cInstructor").value,
    schedule: document.getElementById("cTime").value,
    room_number: document.getElementById("cRoom").value,
    instructor_email: "faculty@san.edu",
    section: 1,
    semester: "Fall-2025",
  };
  await fetch(`${API_URL}/admin/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  alert("Course Added!");
  e.target.reset();
  loadAdminCourses(); // Refresh table
}

async function deleteCourse(id) {
    if(!confirm("Delete this course completely? This will remove all student enrollments associated with it.")) return;
    try {
        await fetch(`${API_URL}/admin/courses/${id}`, { method: 'DELETE' });
        loadAdminCourses();
    } catch(e) { console.error(e); }
}

// --- 4. UPLOAD GRADES ---
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

// --- 5. SEMESTERS ---
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

// --- 6. ADVISING SLOTS (Gatekeeper) ---
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
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify(body)
    });
    alert("Time Slot Created!");
    loadSlots();
    e.target.reset();
}

async function deleteSlot(id) {
    if(!confirm("Remove this time slot?")) return;
    await fetch(`${API_URL}/admin/slots/${id}`, { method: 'DELETE' });
    loadSlots();
}

// --- 7. ANNOUNCEMENTS ---
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

// --- 8. FINANCIALS ---
async function loadFinancials() {
  const res = await fetch(`${API_URL}/admin/financials`);
  const data = await res.json();
  document.getElementById("financialsList").innerHTML = `<table style="width:100%"><thead><tr><th>ID</th><th>Name</th><th>Credits</th><th>Due</th><th>Status</th></tr></thead><tbody>${data
    .map((r) =>
        `<tr><td>${r.student_id}</td><td>${r.name}</td><td>${r.credits}</td><td>$${r.amountDue}</td><td style="color:${r.status === "Pending" ? "orange" : "green"}">${r.status}</td></tr>`
    ).join("")}</tbody></table>`;
}

// --- 9. ADD ADMIN ---
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