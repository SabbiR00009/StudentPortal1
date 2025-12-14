const API_URL = "http://localhost:3000/api";
const user = JSON.parse(sessionStorage.getItem('facultyUser'));

if (!user) window.location.href = "index.html";

let myCourses = [];
let activeCourseId = null;
let currentAttendanceState = {}; // { studentId: 'present' | 'absent' | 'late' }

document.addEventListener("DOMContentLoaded", () => {
    initUI();
    fetchCourses();
    
    // Set default date for attendance to today
    document.getElementById("attDate").valueAsDate = new Date();
    document.getElementById("attDate").addEventListener("change", loadAttendanceForDate);

    // Form Listeners
    document.getElementById("noticeForm").addEventListener("submit", postNotice);
    document.getElementById("materialForm").addEventListener("submit", postMaterial);
});

function initUI() {
    document.getElementById("facName").innerText = user.name;
    document.getElementById("facEmail").innerText = user.email;
    document.getElementById("facAvatar").innerText = user.name.charAt(0);
}

function logout() {
    sessionStorage.removeItem('facultyUser');
    window.location.href = "index.html";
}

// --- NAVIGATION ---
function switchMainView(viewId) {
    document.querySelectorAll(".view-section").forEach(el => el.classList.remove("active"));
    document.getElementById(`view-${viewId}`).classList.add("active");
    
    document.querySelectorAll(".side-panel .nav-btn").forEach(btn => btn.classList.remove("active"));
    event.currentTarget.classList.add("active");
}

function switchCourseTab(tabId) {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active"));
    
    event.currentTarget.classList.add("active");
    document.getElementById(`tab-${tabId}`).classList.add("active");
}

// --- DATA LOADING ---
async function fetchCourses() {
    const res = await fetch(`${API_URL}/faculty/${user.email}/courses`);
    myCourses = await res.json();
    renderSidebar();
    renderDashboard();
}

function renderSidebar() {
    const list = document.getElementById("sidebarCourseList");
    if(myCourses.length === 0) {
        list.innerHTML = "<p style='padding:15px; color:#888;'>No courses assigned.</p>";
        return;
    }
    list.innerHTML = myCourses.map(c => `
        <button class="nav-btn" onclick="openCourseManager(${c.id})">
            <i class="fas fa-book"></i> ${c.code}
        </button>
    `).join("");
}

function renderDashboard() {
    const grid = document.getElementById("dashboardCourseGrid");
    grid.innerHTML = myCourses.map(c => `
        <div class="dash-card" onclick="openCourseManager(${c.id})">
            <h3>${c.code}</h3>
            <p style="font-weight:bold; color:#4b5563;">${c.name}</p>
            <div style="margin-top:15px; display:flex; justify-content:space-between; color:#6b7280; font-size:0.9em;">
                <span><i class="fas fa-users"></i> ${c.enrolled_real} Enrolled</span>
                <span><i class="fas fa-clock"></i> ${c.schedule}</span>
            </div>
        </div>
    `).join("");
}

// --- COURSE MANAGER ---
async function openCourseManager(courseId) {
    activeCourseId = courseId;
    const course = myCourses.find(c => c.id === courseId);
    
    // Update Header
    document.getElementById("cmCode").innerText = course.code;
    document.getElementById("cmName").innerText = course.name;
    document.getElementById("cmSchedule").innerText = course.schedule;
    document.getElementById("cmCount").innerText = course.enrolled_real;

    // Show View
    switchMainView("course-manager"); // This effectively hacks the view switcher
    document.getElementById("view-course-manager").classList.add("active");
    
    // Load Data
    loadRoster();
    loadMaterials();
    loadAttendanceForDate(); // Loads roster for attendance grid
}

// --- TAB 1: ROSTER & GRADES ---
async function loadRoster() {
    const res = await fetch(`${API_URL}/faculty/course/${activeCourseId}/students`);
    const students = await res.json();
    
    const tbody = document.getElementById("rosterList");
    tbody.innerHTML = students.map(s => {
        const totalAtt = s.present_count + s.absent_count;
        const attPct = totalAtt > 0 ? Math.round((s.present_count / totalAtt) * 100) : 0;
        
        return `
        <tr>
            <td>${s.student_id}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${s.avatar}" style="width:30px; height:30px; border-radius:50%;">
                    ${s.name}
                </div>
            </td>
            <td>
                <div style="background:#e5e7eb; height:6px; width:60px; border-radius:3px; overflow:hidden;">
                    <div style="background:${attPct < 70 ? 'red' : 'green'}; width:${attPct}%; height:100%;"></div>
                </div>
                <small>${attPct}%</small>
            </td>
            <td>
                <span class="grade-pill" style="background:#f3f4f6;">${s.grade || '-'}</span>
            </td>
            <td>
                <button class="admin-btn primary small" onclick="promptGrade(${s.id}, '${s.grade || ''}')">Grade</button>
            </td>
        </tr>
    `}).join("");
}

async function promptGrade(studentDbId, currentGrade) {
    const newGrade = prompt("Enter Grade (A, A-, B+, etc):", currentGrade);
    if(newGrade && newGrade !== currentGrade) {
        await fetch(`${API_URL}/faculty/grade`, {
            method: "POST",
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ studentDbId, courseId: activeCourseId, grade: newGrade.toUpperCase(), semester: "Fall-2025" })
        });
        loadRoster();
    }
}

// --- TAB 2: ATTENDANCE SYSTEM ---
async function loadAttendanceForDate() {
    if(!activeCourseId) return;
    const date = document.getElementById("attDate").value;
    
    // 1. Get Students
    const sRes = await fetch(`${API_URL}/faculty/course/${activeCourseId}/students`);
    const students = await sRes.json();
    
    // 2. Get Existing Attendance
    const aRes = await fetch(`${API_URL}/faculty/course/${activeCourseId}/attendance/${date}`);
    const records = await aRes.json();
    
    // Map existing records
    currentAttendanceState = {};
    students.forEach(s => {
        const rec = records.find(r => r.student_id === s.id);
        currentAttendanceState[s.id] = rec ? rec.status : 'present'; // Default to present
    });
    
    renderAttendanceGrid(students);
}

function renderAttendanceGrid(students) {
    const grid = document.getElementById("attendanceGrid");
    grid.innerHTML = students.map(s => {
        const status = currentAttendanceState[s.id];
        return `
        <div class="att-card ${status}" onclick="toggleAttendance(${s.id}, this)">
            <div style="font-weight:bold;">${s.student_id}</div>
            <div style="font-size:0.8em; margin-bottom:5px;">${s.name.split(' ')[0]}</div>
            <span style="font-size:0.7em; text-transform:uppercase; font-weight:bold;">${status}</span>
        </div>
    `}).join("");
}

function toggleAttendance(studentId, cardEl) {
    const states = ['present', 'absent', 'late'];
    let current = currentAttendanceState[studentId];
    let next = states[(states.indexOf(current) + 1) % 3];
    
    currentAttendanceState[studentId] = next;
    
    // Update UI class
    cardEl.className = `att-card ${next}`;
    cardEl.querySelector('span').innerText = next;
}

async function saveAttendance() {
    const date = document.getElementById("attDate").value;
    const attendanceData = Object.keys(currentAttendanceState).map(sid => ({
        studentId: parseInt(sid),
        status: currentAttendanceState[sid]
    }));
    
    await fetch(`${API_URL}/faculty/attendance`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ courseId: activeCourseId, date, attendanceData })
    });
    alert("Attendance Saved!");
}

// --- TAB 3: MATERIALS & NOTICES ---
async function loadMaterials() {
    const res = await fetch(`${API_URL}/faculty/course/${activeCourseId}/materials`);
    const { materials, notices } = await res.json();
    
    document.getElementById("noticeList").innerHTML = notices.map(n => `
        <div style="background:#fff7ed; padding:10px; border-left:3px solid orange; margin-bottom:10px; border-radius:4px;">
            <div style="font-weight:bold;">${n.title}</div>
            <div style="font-size:0.9em; color:#666;">${n.message}</div>
            <div style="font-size:0.7em; color:#999; margin-top:5px;">${new Date(n.created_at).toLocaleDateString()}</div>
        </div>
    `).join("");

    document.getElementById("materialList").innerHTML = materials.map(m => `
        <div style="border:1px solid #eee; padding:10px; margin-bottom:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:bold; color:#4f46e5;">
                    <i class="fas ${m.type === 'lecture' ? 'fa-file-powerpoint' : 'fa-file-alt'}"></i> 
                    ${m.title}
                </div>
                <div style="font-size:0.8em; color:#666;">${m.description || ''}</div>
                ${m.link ? `<a href="${m.link}" target="_blank" style="font-size:0.8em; color:#3b82f6;">Open Link</a>` : ''}
            </div>
            <button onclick="deleteMaterial(${m.id})" style="color:red; background:none; border:none; cursor:pointer;"><i class="fas fa-trash"></i></button>
        </div>
    `).join("");
}

async function postNotice(e) {
    e.preventDefault();
    await fetch(`${API_URL}/faculty/notices`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            courseId: activeCourseId,
            title: document.getElementById("noteTitle").value,
            message: document.getElementById("noteMsg").value
        })
    });
    e.target.reset();
    loadMaterials();
}

async function postMaterial(e) {
    e.preventDefault();
    await fetch(`${API_URL}/faculty/materials`, {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            courseId: activeCourseId,
            title: document.getElementById("matTitle").value,
            type: document.getElementById("matType").value,
            link: document.getElementById("matLink").value,
            description: document.getElementById("matDesc").value
        })
    });
    e.target.reset();
    loadMaterials();
}

async function deleteMaterial(id) {
    if(!confirm("Delete?")) return;
    await fetch(`${API_URL}/faculty/materials/${id}`, { method: 'DELETE' });
    loadMaterials();
}