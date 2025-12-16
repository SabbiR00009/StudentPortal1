const API_URL = "http://localhost:3000/api";
let currentUser = JSON.parse(sessionStorage.getItem('facultyUser'));
let currentAdviseeId = null;

// ==========================================
// 1. INITIALIZATION & NAVIGATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser) {
        window.location.href = "index.html";
        return;
    }
    setupUI();

    // --- NAVIGATION FIX: Handle Browser Back Button ---
    window.addEventListener('popstate', (event) => {
        // If state exists, go to that view, otherwise default to overview
        const view = (event.state && event.state.view) ? event.state.view : 'overview';
        // Call switchMainView with pushState = false to prevent history loop
        switchMainView(view, null, false);
    });

    // --- NAVIGATION FIX: Handle Initial Load via URL Hash ---
    const initialView = location.hash.replace('#', '') || 'overview';
    const activeBtn = document.querySelector(`.nav-btn[onclick*="'${initialView}'"]`);

    // Load initial view
    switchMainView(initialView, activeBtn, false);
    // Replace current history state so we have a starting point
    history.replaceState({ view: initialView }, null, `#${initialView}`);
});

function setupUI() {
    if (document.getElementById("facName")) document.getElementById("facName").innerText = currentUser.name;
    if (document.getElementById("facEmail")) document.getElementById("facEmail").innerText = currentUser.email;
    if (document.getElementById("facAvatar")) document.getElementById("facAvatar").innerText = currentUser.name.charAt(0);

    if (document.getElementById("profName")) document.getElementById("profName").innerText = currentUser.name;
    if (document.getElementById("profDept")) document.getElementById("profDept").innerText = currentUser.department;
    if (document.getElementById("profEmail")) document.getElementById("profEmail").innerText = currentUser.email;
    if (document.getElementById("profDesg")) document.getElementById("profDesg").innerText = currentUser.designation || 'Faculty';
}

function logout() {
    sessionStorage.removeItem('facultyUser');
    window.location.href = "index.html";
}

// --- NAVIGATION FIX: Updated Switch Function ---
function switchMainView(viewName, btn, pushState = true) {
    // 1. Update Browser History
    if (pushState) {
        history.pushState({ view: viewName }, null, `#${viewName}`);
    }

    // 2. Hide all main sections
    document.querySelectorAll(".view-section").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));

    // 3. Show target section
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add("active");

    // 4. Highlight Sidebar Button
    if (btn) {
        btn.classList.add("active");
    } else {
        // Try to find the button automatically (useful for back button logic)
        const autoBtn = document.querySelector(`.nav-btn[onclick*="'${viewName}'"]`);
        if (autoBtn) autoBtn.classList.add("active");
    }

    // 5. Trigger Data Loads based on View
    if (viewName === 'overview') loadDashboardData();
    if (viewName === 'advising') {
        closeAdvisingPanel();
        loadAdvisees();
    }
}

// ==========================================
// 2. SECURITY SECTION (ADDED)
// ==========================================
async function handlePasswordChange(e) {
    e.preventDefault();
    const oldPass = document.getElementById("secOldPass").value;
    const newPass = document.getElementById("secNewPass").value;

    if (newPass.length < 6) return alert("Password must be at least 6 characters.");

    try {
        const res = await fetch(`${API_URL}/change-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: currentUser.id,
                role: 'faculty',
                oldPassword: oldPass,
                newPassword: newPass
            })
        });
        const data = await res.json();
        if (data.success) {
            alert("✅ Password Updated! Please login again.");
            logout();
        } else {
            alert("❌ Error: " + data.error);
        }
    } catch (err) {
        alert("Connection Error");
    }
}

// ==========================================
// 3. DASHBOARD & COURSES
// ==========================================
async function loadDashboardData() {
    try {
        const res = await fetch(`${API_URL}/faculty/${currentUser.email}/courses`);
        const courses = await res.json();

        // 1. Stats
        if (document.getElementById("statCourses")) document.getElementById("statCourses").innerText = courses.length;
        const totalStudents = courses.reduce((sum, c) => sum + (c.enrolled_real || 0), 0);
        if (document.getElementById("statStudents")) document.getElementById("statStudents").innerText = totalStudents;

        // 2. Sidebar Quick Access
        const sidebar = document.getElementById("sidebarCourseList");
        if (sidebar) {
            sidebar.innerHTML = courses.map(c => `
                <button class="nav-btn small" onclick="openCourseManager(${c.id}, '${c.code}', '${c.name}')">
                    ${c.code}
                </button>
            `).join("");
        }

        // 3. Dashboard Schedule Table
        const schedBody = document.getElementById("dashboardScheduleBody");
        if (schedBody) {
            schedBody.innerHTML = courses.map(c => `
                <tr>
                    <td style="font-weight:bold; color:#4F46E5;">${c.code}</td>
                    <td>${c.theory_days}</td>
                    <td>${c.room_number}</td>
                    <td>${c.theory_time}</td>
                </tr>
            `).join("");
        }

        // 4. Dashboard Course Grid
        const grid = document.getElementById("dashboardCourseGrid");
        if (grid) {
            grid.innerHTML = courses.map(c => `
                <div class="card" style="border-top: 4px solid #4F46E5; cursor:pointer;" onclick="openCourseManager(${c.id}, '${c.code}', '${c.name}')">
                    <h3 style="margin:0;">${c.code}</h3>
                    <p style="color:#666; font-size:0.9em;">${c.name}</p>
                    <div style="margin-top:15px; display:flex; justify-content:space-between; align-items:center;">
                        <span style="background:#e0e7ff; color:#4338ca; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">
                            Section ${c.section}
                        </span>
                        <span style="color:#666; font-size:0.9em;">${c.enrolled_real} Students</span>
                    </div>
                </div>
            `).join("");
        }

    } catch (e) { console.error(e); }
}

// ==========================================
// 4. COURSE MANAGER (Grades & Roster)
// ==========================================
let currentCourseId = null;

function openCourseManager(courseId, code, name) {
    currentCourseId = courseId;
    document.getElementById("cmCode").innerText = code;
    document.getElementById("cmName").innerText = name;

    // Switch View manually (not using switchMainView to avoid history clutter for sub-views if preferred)
    document.querySelectorAll(".view-section").forEach(el => el.classList.remove("active"));
    document.getElementById("view-course-manager").classList.add("active");

    loadRoster();
}

function switchCourseTab(tabName) {
    if (tabName === 'roster') loadRoster();
}

async function loadRoster() {
    try {
        const res = await fetch(`${API_URL}/faculty/course/${currentCourseId}/students`);
        const students = await res.json();

        const countEl = document.getElementById("cmCount");
        if (countEl) countEl.innerText = `${students.length} Enrolled`;

        const tbody = document.getElementById("rosterList");
        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No students enrolled yet.</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(s => `
            <tr>
                <td><b>${s.student_id}</b></td>
                <td>${s.name}</td>
                <td style="text-align:center;">
                    <input type="number" value="${s.marks || ''}" 
                        onchange="submitGrade(${s.id}, ${currentCourseId}, this.value)"
                        style="width:60px; text-align:center; padding:5px; border:1px solid #ddd; border-radius:4px;">
                </td>
                <td style="text-align:center; font-weight:bold; color:${getColorForGrade(s.grade)}">
                    <span id="grade-${s.id}">${s.grade || '-'}</span>
                </td>
                <td style="text-align:right;">
                    <button onclick="showStudentDetails(${s.id})" class="admin-btn secondary small">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error(e); }
}

async function submitGrade(studentDbId, courseId, marks) {
    if (marks === "") return;
    try {
        const res = await fetch(`${API_URL}/faculty/grade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentDbId,
                courseId,
                marks,
                semester: "Fall-2025"
            })
        });
        const data = await res.json();
        if (data.success) {
            const gradeSpan = document.getElementById(`grade-${studentDbId}`);
            if (gradeSpan) {
                gradeSpan.innerText = data.grade;
                gradeSpan.style.color = getColorForGrade(data.grade);
            }
        } else {
            alert("Error saving grade: " + data.error);
        }
    } catch (e) { console.error(e); }
}

function getColorForGrade(g) {
    if (!g) return '#000';
    if (g === 'F') return 'red';
    if (g.startsWith('A')) return 'green';
    return '#d97706';
}

// ==========================================
// 5. ADVISING SYSTEM
// ==========================================

// 1. Load Advisee List
async function loadAdvisees() {
    try {
        const res = await fetch(`${API_URL}/faculty/${currentUser.email}/advisees`);
        const students = await res.json();

        if (document.getElementById("statAdvisees")) document.getElementById("statAdvisees").innerText = students.length;

        const tbody = document.getElementById("adviseeList");
        if (!tbody) return;

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No advisees assigned.</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(s =>
            `
            <tr>
                <td><b>${s.student_id}</b></td>
                <td>${s.name}</td>
                <td><span style="background:#f3f4f6; padding:2px 6px; border-radius:4px;">${s.department}</span></td>
                <td style="text-align:right;">
                    <button onclick="openAdvisingPanel(${s.id})" class="admin-btn primary small">
                        <i class="fas fa-edit"></i> Manage
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (e) { console.error(e); }
}

// 2. Open Panel
async function openAdvisingPanel(studentDbId) {
    currentAdviseeId = studentDbId;


    // Toggle Sections
    const listView = document.getElementById("advising-list-view") || document.getElementById("view-advising").children[0];
    const panelView = document.getElementById("advising-panel-view") || document.getElementById("view-advising").children[1];

    if (listView) listView.style.display = "none";
    if (panelView) panelView.style.display = "block";

    // Set Loading State
    document.getElementById("advStudentName").innerText = "Loading...";
    document.getElementById("advisingCourseSelect").innerHTML = "<option>Loading Catalog...</option>";

    try {
        const res = await fetch(`${API_URL}/faculty/student-profile/${studentDbId}`);
        const data = await res.json();

        // Fill Header
        document.getElementById("advStudentName").innerText = data.student.name;
        document.getElementById("advStudentId").innerText = data.student.student_id;
        document.getElementById("advStudentGpa").innerText = (data.student.gpa || 0.0).toFixed(2);

        // Fill History
        const histBody = document.getElementById("adviseHistoryList");
        if (histBody) {
            histBody.innerHTML = data.history.map(h => `
                <tr>
                    <td>${h.semester}</td>
                    <td>${h.code}</td>
                    <td style="font-weight:bold; color:${getColorForGrade(h.grade)}">${h.grade}</td>
                </tr>
            `).join("");
        }

        // Fill Current Schedule
        renderAdviseSchedule(data.current);

        // Load Dropdown
        loadAdvisingCatalog(data.current, data.history);

    } catch (e) {
        console.error(e);
        alert("Failed to load student data.");
        closeAdvisingPanel();
    }
}

function closeAdvisingPanel() {
    const listView = document.getElementById("advising-list-view") || document.getElementById("view-advising").children[0];
    const panelView = document.getElementById("advising-panel-view") || document.getElementById("view-advising").children[1];

    if (panelView) panelView.style.display = "none";
    if (listView) listView.style.display = "block";

    currentAdviseeId = null;
}

function renderAdviseSchedule(courses) {
    const tbody = document.getElementById("adviseCurrentSchedule");
    if (!tbody) return;

    if (courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="color:#666; font-style:italic; padding:10px;">No active courses.</td></tr>';
        return;
    }

    tbody.innerHTML = courses.map(c => `
        <tr>
            <td><b>${c.code}</b></td>
            <td>${c.schedule || 'TBA'}</td>
            <td style="text-align:right;">
                <button onclick="facultyDropCourse(${c.course_id || c.id})" style="color:#dc2626; background:none; border:none; cursor:pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

async function loadAdvisingCatalog(current, history) {
    try {
        const res = await fetch(`${API_URL}/advising/courses`);
        const allCourses = await res.json();

        // Filter out taken/enrolled
        const takenCodes = [...current.map(c => c.code), ...history.map(h => h.code)];
        const available = allCourses.filter(c => !takenCodes.includes(c.code));

        const select = document.getElementById("advisingCourseSelect");
        if (!select) return;

        select.innerHTML = `<option value="" disabled selected>Select Course...</option>` +
            available.map(c => {
                const isFull = (c.enrolled_count || 0) >= c.max_students;
                const label = isFull ? "(FULL)" : "";
                const disabled = isFull ? "disabled" : "";
                return `<option value="${c.code}" ${disabled}>
                    ${c.code} (${c.section}) - ${c.theory_days} ${c.theory_time} ${label}
                </option>`;
            }).join("");
    } catch (e) { console.error("Catalog load error", e); }
}

async function facultyEnrollStudent() {
    const code = document.getElementById("advisingCourseSelect").value;
    if (!code || code === "Loading Catalog...") return alert("Select a course");

    try {
        const res = await fetch(`${API_URL}/admin/student/enroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentDbId: currentAdviseeId, courseCode: code })
        });
        const data = await res.json();

        if (data.success) {
            alert("✅ Enrolled");
            openAdvisingPanel(currentAdviseeId); // Refresh
        } else {
            alert("🚫 " + data.error);
        }
    } catch (e) { alert("Connection Error"); }
}

async function facultyDropCourse(courseId) {
    if (!confirm("Drop this course?")) return;
    try {
        const res = await fetch(`${API_URL}/admin/student/drop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ studentDbId: currentAdviseeId, type: "course", targetId: courseId })
        });
        const data = await res.json();
        if (data.success) {
            openAdvisingPanel(currentAdviseeId); // Refresh
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) { console.error(e); }
}

// ==========================================
// 6. MODAL DETAILS (Read Only)
// ==========================================
async function showStudentDetails(studentDbId) {
    const modal = document.getElementById('studentDetailModal');
    if (modal) modal.style.display = 'flex';

    try {
        const res = await fetch(`${API_URL}/faculty/student-profile/${studentDbId}`);
        const data = await res.json();

        if (document.getElementById("sdName")) document.getElementById("sdName").innerText = data.student.name;
        if (document.getElementById("sdId")) document.getElementById("sdId").innerText = `ID: ${data.student.student_id}`;

        if (document.getElementById("sdCurrentCourses")) {
            document.getElementById("sdCurrentCourses").innerHTML = data.current.map(c =>
                `<tr><td>${c.code}</td><td>${c.name}</td></tr>`
            ).join("");
        }

        if (document.getElementById("sdTranscript")) {
            document.getElementById("sdTranscript").innerHTML = data.history.map(h =>
                `<tr><td>${h.semester}</td><td>${h.code}</td><td>${h.grade}</td></tr>`
            ).join("");
        }
    } catch (e) { console.error(e); }
}