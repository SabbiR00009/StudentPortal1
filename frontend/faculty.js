const API_URL = "http://localhost:3000/api";
const user = JSON.parse(sessionStorage.getItem('facultyUser'));

// 1. Security Check
if (!user) {
    window.location.href = "index.html";
}

let myCourses = [];
let activeCourseId = null;
let currentAdviseeId = null;

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    fetchCourses();
    loadAdvisees(); // Load advising list on startup
});

function initUI() {
    document.getElementById("facName").innerText = user.name;
    document.getElementById("facEmail").innerText = user.email;
    document.getElementById("facAvatar").innerText = user.name.charAt(0);

    // Set Profile Tab info
    document.getElementById("profName").innerText = user.name;
    document.getElementById("profDesg").innerText = user.designation || "Faculty Member";
    document.getElementById("profDept").innerText = user.department;
    document.getElementById("profEmail").innerText = user.email;
}

function logout() {
    sessionStorage.removeItem('facultyUser');
    window.location.href = "index.html";
}

// --- NAVIGATION --- 
function switchMainView(viewId, btnElement) {
    // 1. Hide all views
    document.querySelectorAll(".view-section").forEach(el => el.classList.remove("active"));
    // 2. Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add("active");

    // 3. Update Sidebar Buttons
    if (btnElement) {
        document.querySelectorAll(".nav-menu .nav-btn").forEach(btn => btn.classList.remove("active"));
        btnElement.classList.add("active");
    }
}

function switchCourseTab(tabId) {
    document.querySelectorAll(".course-tab-content").forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${tabId}`).style.display = 'block';
}

// --- DASHBOARD & SCHEDULE --- 
async function fetchCourses() {
    try {
        const res = await fetch(`${API_URL}/faculty/${user.email}/courses`);
        myCourses = await res.json();

        renderSidebar();
        renderDashboardStats();
        renderSchedule();
    } catch (e) {
        console.error("Error fetching courses:", e);
    }
}

function renderDashboardStats() {
    // Update Stats Cards
    document.getElementById("statCourses").innerText = myCourses.length;

    let totalStudents = 0;
    myCourses.forEach(c => totalStudents += (c.enrolled_real || 0));
    document.getElementById("statStudents").innerText = totalStudents;

    const grid = document.getElementById("dashboardCourseGrid");
    grid.innerHTML = myCourses.map(c => `
        <div class="card" style="cursor:pointer; border:1px solid #eee" onclick="openCourseManager(${c.id})">
            <div style="display:flex; justify-content:space-between;">
                <h3 style="margin:0; color:#4f46e5">${c.code}</h3>
                <span style="font-size:0.8em; background:#e0e7ff; color:#4338ca; padding:2px 6px; border-radius:4px">${c.section || 'A'}</span>
            </div>
            <p style="font-weight:600; color:#4b5563; margin:5px 0">${c.name}</p>
            <div style="margin-top:15px; display:flex; justify-content:space-between; color:#6b7280; font-size:0.85em">
                <span><i class="fas fa-users"></i> ${c.enrolled_real || 0} Students</span>
                <span><i class="fas fa-clock"></i> ${c.room_number || 'TBA'}</span>
            </div>
        </div>
    `).join("");
}

function renderSchedule() {
    const tbody = document.getElementById("dashboardScheduleBody");
    if (myCourses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px;">No courses assigned this semester.</td></tr>`;
        return;
    }

    // Combine Theory and Lab schedules into a list
    let scheduleRows = myCourses.map(c => {
        return `
            <tr>
                <td style="font-weight:600">${c.code}</td>
                <td>${c.theory_days || c.lab_day || '-'}</td>
                <td>${c.room_number || 'TBA'}</td>
                <td>${c.theory_time || c.lab_time || '-'}</td>
            </tr>
        `;
    }).join("");

    tbody.innerHTML = scheduleRows;
}

function renderSidebar() {
    const list = document.getElementById("sidebarCourseList");
    if (myCourses.length === 0) {
        list.innerHTML = `<p style="padding:15px;color:#888">No courses.</p>`;
        return;
    }
    list.innerHTML = myCourses.map(c =>
        `<button class="nav-btn" onclick="openCourseManager(${c.id})"><i class="fas fa-book"></i> ${c.code}</button>`
    ).join("");
}

// --- ADVISING SYSTEM ---
async function loadAdvisees() {
    const user = JSON.parse(sessionStorage.getItem('facultyUser')); // Assuming you store faculty info here
    if (!user) return;

    try {
        const res = await fetch(`${API_URL}/faculty/${user.email}/advisees`);
        const students = await res.json();

        const tbody = document.getElementById("adviseeList"); // Make sure you have a <tbody> with this ID

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px;">No advisees assigned to you.</td></tr>';
            return;
        }

        tbody.innerHTML = students.map(s => `
            <tr>
                <td><b>${s.student_id}</b></td>
                <td>${s.name}</td>
                <td>${s.department}</td>
                <td>
                    <button onclick="openAdvisingPanel(${s.id})" class="action-btn" style="background-color: #4F46E5; color: white;">
                        <i class="fas fa-user-graduate"></i> Manage Advising
                    </button>
                </td>
            </tr>
        `).join("");
    } catch (e) {
        console.error("Error loading advisees:", e);
    }
}

// 2. Open the Advising "Modal" or View for a specific student
async function openAdvisingPanel(studentDbId) {
    currentAdviseeId = studentDbId;

    // Hide list, Show Panel (Assuming you have these divs in your HTML)
    document.getElementById("view-advisees-list").style.display = "none";
    document.getElementById("view-advising-panel").style.display = "block";

    // Fetch Full Profile (Transcript + Current Schedule)
    const res = await fetch(`${API_URL}/faculty/student-profile/${studentDbId}`);
    const data = await res.json();

    // Fill Student Info
    document.getElementById("advStudentName").innerText = data.student.name;
    document.getElementById("advStudentId").innerText = data.student.student_id;
    document.getElementById("advStudentGpa").innerText = (data.student.gpa || 0.0).toFixed(2);

    // Fill History Table
    const historyBody = document.getElementById("adviseHistoryList");
    historyBody.innerHTML = data.history.map(h => `
        <tr>
            <td>${h.semester}</td>
            <td>${h.code}</td>
            <td>${h.name}</td>
            <td><b>${h.grade}</b></td>
        </tr>
    `).join("");

    // Fill Current Schedule (and setup Drop buttons)
    renderAdviseSchedule(data.current);

    // Load Course Catalog for the Dropdown (filtering out taken courses)
    loadAdvisingCatalog(data.current, data.history);
}

// Helper to render the current schedule table
function renderAdviseSchedule(courses) {
    const tbody = document.getElementById("adviseCurrentSchedule");
    if (courses.length === 0) {
        tbody.innerHTML = "<tr><td colspan='4'>No courses enrolled.</td></tr>";
        return;
    }

    tbody.innerHTML = courses.map(c => `
        <tr>
            <td>${c.code}</td>
            <td>${c.name}</td>
            <td style="font-size:0.85em">${c.schedule || '-'}</td>
            <td>
                <button onclick="facultyDropCourse('${c.code}')" style="color:red; background:none; border:none; cursor:pointer;">
                    Drop
                </button>
            </td>
        </tr>
    `).join("");
}

// 3. Load Courses into the Select Dropdown
async function loadAdvisingCatalog(current, history) {
    const res = await fetch(`${API_URL}/advising/courses`);
    const allCourses = await res.json();

    // Filter: Remove courses already passed or currently enrolled
    const takenCodes = [...current.map(c => c.code), ...history.map(h => h.code)];
    const available = allCourses.filter(c => !takenCodes.includes(c.code));

    const select = document.getElementById("advisingCourseSelect");
    select.innerHTML = `<option value="" disabled selected>Select Course to Add...</option>` +
        available.map(c => `<option value="${c.code}">${c.code} - ${c.name} (${c.credits} Cr)</option>`).join("");
}

// 4. Action: Enroll Student (Reuses Admin API for validation)
async function facultyEnrollStudent() {
    const courseCode = document.getElementById("advisingCourseSelect").value;
    if (!courseCode) return alert("Please select a course.");

    try {
        const res = await fetch(`${API_URL}/admin/student/enroll`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentDbId: currentAdviseeId,
                courseCode: courseCode
            })
        });

        const data = await res.json();

        if (data.success) {
            alert("✅ Enrolled Successfully");
            // Refresh the panel data
            openAdvisingPanel(currentAdviseeId);
        } else {
            alert("🚫 " + data.error); // Shows Time Conflict or Duplicate error
        }
    } catch (e) {
        alert("Connection Error");
    }
}

// 5. Action: Drop Course
async function facultyDropCourse(courseCode) { // Note: We need course ID usually, but let's look up by code or fix API
    if (!confirm("Drop " + courseCode + " for this student?")) return;

    // We need to find the course ID from the code first, or use the API that takes ID.
    // Ideally, pass the ID in the renderAdviseSchedule function. 
    // *Correction*: Let's fix renderAdviseSchedule to pass the ID.

    /* FIX: in renderAdviseSchedule, change onclick to:
       onclick="facultyDropCourseById(${c.id})" 
    */
}

async function facultyDropCourseById(courseId) {
    try {
        const res = await fetch(`${API_URL}/admin/student/drop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentDbId: currentAdviseeId,
                type: "course",
                targetId: courseId
            })
        });

        const data = await res.json();
        if (data.success) {
            alert("Course Dropped.");
            openAdvisingPanel(currentAdviseeId);
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) { console.error(e); }
}

function closeAdvisingPanel() {
    document.getElementById("view-advising-panel").style.display = "none";
    document.getElementById("view-advisees-list").style.display = "block";
    currentAdviseeId = null;
}

// --- STUDENT PROFILE MODAL (Used in Advising) ---
async function viewStudentProfile(studentDbId) {
    const modal = document.getElementById("studentDetailModal");

    // Show Loading state inside modal
    document.getElementById("sdName").innerText = "Loading...";
    modal.style.display = "flex";

    try {
        const res = await fetch(`${API_URL}/faculty/student-profile/${studentDbId}`);
        const data = await res.json();

        // Populate Basic Info
        document.getElementById("sdName").innerText = data.student.name;
        document.getElementById("sdId").innerText = `ID: ${data.student.student_id} | Dept: ${data.student.department}`;

        // Populate Current Courses
        const currBody = document.getElementById("sdCurrentCourses");
        if (data.current.length > 0) {
            currBody.innerHTML = data.current.map(c => `
                <tr>
                    <td>${c.code}</td>
                    <td>${c.name}</td>
                </tr>
            `).join("");
        } else {
            currBody.innerHTML = `<tr><td colspan="2">Not enrolled in any courses.</td></tr>`;
        }

        // Populate Transcript History
        const transBody = document.getElementById("sdTranscript");
        if (data.history.length > 0) {
            transBody.innerHTML = data.history.map(h => `
                <tr>
                    <td>${h.semester}</td>
                    <td>${h.code}</td>
                    <td><span class="grade-pill">${h.grade}</span></td>
                </tr>
            `).join("");
        } else {
            transBody.innerHTML = `<tr><td colspan="3">No completed courses yet.</td></tr>`;
        }

    } catch (e) {
        alert("Failed to load student details");
        modal.style.display = "none";
    }
}

// --- COURSE MANAGER (Grading) --- 
async function openCourseManager(courseId) {
    activeCourseId = courseId;
    const course = myCourses.find(c => c.id === courseId);

    if (!course) return;

    // Set Header Info
    document.getElementById("cmCode").innerText = course.code;
    document.getElementById("cmName").innerText = course.name;
    // We will update the count after we load the actual student list to be accurate
    document.getElementById("cmCount").innerText = "Loading...";

    // Switch View 
    switchMainView("course-manager");

    // Load Data
    loadRoster();
}

async function loadRoster() {
    try {
        const res = await fetch(`${API_URL}/faculty/course/${activeCourseId}/students`);
        const students = await res.json();

        // FIX: Update the enrolled count badge based on actual list length
        document.getElementById("cmCount").innerText = `${students.length} Enrolled`;

        const tbody = document.getElementById("rosterList");

        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px;">No students enrolled yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = students.map(s => {
            // Determine badge color based on grade
            let badgeColor = "#f3f4f6"; // Gray (default)
            let textColor = "#374151";

            if (s.grade === 'F') { badgeColor = "#fee2e2"; textColor = "#991b1b"; } // Red
            else if (s.grade) { badgeColor = "#d1fae5"; textColor = "#065f46"; } // Green

            return `
            <tr>
                <td style="font-family:monospace; font-weight:600; color:#666;">${s.student_id}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:24px; height:24px; background:#e0e7ff; color:#4338ca; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.75em; font-weight:bold;">
                            ${s.name.charAt(0)}
                        </div>
                        ${s.name}
                    </div>
                </td>
                <td style="text-align:center; font-weight:bold; color:#4b5563;">
                    ${s.marks !== null && s.marks !== undefined ? s.marks : '-'}
                </td>
                <td style="text-align:center;">
                    <span style="background:${badgeColor}; color:${textColor}; padding:4px 8px; border-radius:6px; font-weight:600; font-size:0.85em;">
                        ${s.grade || 'N/A'}
                    </span>
                </td>
                <td style="text-align:right;">
                    <button class="admin-btn primary small" 
                        onclick="promptGrade(${s.id}, '${s.marks || ''}')"
                        style="background:#111827; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:0.85em;">
                        <i class="fas fa-edit"></i> Grade
                    </button>
                </td>
            </tr>
            `;
        }).join("");

    } catch (e) {
        console.error("Roster Error", e);
        document.getElementById("rosterList").innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Error loading data</td></tr>`;
    }
}

async function promptGrade(studentDbId, currentMarks) {
    // 1. Ask for MARKS instead of Grade Letter
    const newMarks = prompt("Enter Marks (0 - 100):", currentMarks);

    // 2. Validate Input
    if (newMarks !== null && newMarks.trim() !== "") {
        const marksNum = parseFloat(newMarks);

        if (isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
            alert("Please enter a valid number between 0 and 100.");
            return;
        }

        try {
            // 3. Send to Server
            const res = await fetch(`${API_URL}/faculty/grade`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentDbId: studentDbId,
                    courseId: activeCourseId,
                    marks: marksNum,
                    semester: "Fall-2025"
                })
            });

            const data = await res.json();
            if (data.success) {
                // 4. Reload Table to show calculated grade
                loadRoster();
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Network Error");
        }
    }
}