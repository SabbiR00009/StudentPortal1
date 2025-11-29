const API_URL = "http://localhost:3000/api";
let currentStudent = null;

// --- HISTORY MANAGEMENT ---
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.view) {
    switchView(event.state.view, null, false); // Don't push state on pop
  } else {
    // Default to home if state is empty (e.g. initial landing)
    if (currentStudent) switchView("home", null, false);
  }
});

// Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const studentId = document.getElementById("studentId").value;
  const password = document.getElementById("password").value;
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, password }),
    });
    const data = await res.json();
    if (res.ok) {
      currentStudent = data.student;
      currentStudent.dbId = data.student.id;
      showDashboard();
    } else {
      const err = document.getElementById("errorMessage");
      err.innerText = data.error;
      err.style.display = "block";
    }
  } catch (e) {
    alert("Connection Error");
  }
});

function showDashboard() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  document.getElementById("welcomeMessage").innerText = `Welcome back, ${
    currentStudent.name.split(" ")[0]
  }!`;
  document.getElementById("userName").innerText = currentStudent.name;
  document.getElementById(
    "userIdDisplay"
  ).innerText = `ID: ${currentStudent.student_id}`;
  document.getElementById("userAvatar").innerText =
    currentStudent.name.charAt(0);

  // Check for initial URL hash/state
  const initialView = location.hash.replace("#", "") || "home";
  // Find corresponding button to highlight if available
  const btnId = `btn-${initialView}`;
  const initialBtn = document.getElementById(btnId);

  switchView(initialView, initialBtn, false); // No push on initial load

  loadHomeData();
  loadAnnouncements();
}

function switchView(viewName, btn, updateHistory = true) {
  document
    .querySelectorAll(".view-section")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".nav-btn")
    .forEach((el) => el.classList.remove("active"));

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.add("active");

  // If btn provided, use it. If not (e.g. back button), find it.
  if (btn) {
    btn.classList.add("active");
  } else {
    const navBtn = document.getElementById(`btn-${viewName}`);
    if (navBtn) navBtn.classList.add("active");
  }

  // Update History
  if (updateHistory) {
    history.pushState({ view: viewName }, "", `#${viewName}`);
  }

  if (viewName === "schedule") loadSchedule();
  if (viewName === "grades") loadGrades();
  if (viewName === "advising") loadAdvising();
  if (viewName === "financials") loadFinancials();
}

// --- CORE FUNCTIONS ---

async function loadHomeData() {
  const res = await fetch(`${API_URL}/students/${currentStudent.dbId}/courses`);
  const courses = await res.json();
  const currentCourses = courses.filter((c) => c.status === "enrolled");
  const completedCourses = courses.filter(
    (c) => c.status !== "enrolled" && c.status !== "dropped"
  );

  document.getElementById("coursesCount").innerText = currentCourses.length;
  document.getElementById("creditsCount").innerText = completedCourses.reduce(
    (sum, c) => sum + (c.credits || 0),
    0
  );

  const gRes = await fetch(`${API_URL}/students/${currentStudent.dbId}/grades`);
  const grades = await gRes.json();
  document.getElementById("gpaDisplay").innerText = calculateCGPA(grades);
  document.getElementById("semestersCount").innerText = new Set(
    grades.map((g) => g.semester)
  ).size;

  document.getElementById("coursesList").innerHTML = currentCourses.length
    ? currentCourses
        .map(
          (c) => `
                <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-weight:700; color:#374151;">${c.code} - ${c.name}</div>
                        <div style="font-size:0.85em; color:#6b7280; margin-top:2px;">${c.schedule} • ${c.room_number}</div>
                    </div>
                    <span style="background:#e0e7ff; color:#4338ca; padding:4px 10px; border-radius:6px; font-size:0.8em; font-weight:600;">Active</span>
                </div>
            `
        )
        .join("")
    : '<p style="color:#666; font-style:italic;">No active courses.</p>';
}

async function loadSchedule() {
  const res = await fetch(`${API_URL}/students/${currentStudent.dbId}/courses`);
  const courses = await res.json();
  const current = courses.filter((c) => c.status === "enrolled");
  const history = courses.filter((c) => c.status !== "enrolled");

  let html = "";

  // --- CURRENT SEMESTER (COLOR BLOCK) ---
  if (current.length > 0) {
    // Determine theme based on semester name of first course, or default to Fall-2025
    const currentSem = current[0].semester || "Fall-2025 (Current)";
    let themeClass = "theme-default";
    if (currentSem.includes("Spring")) themeClass = "theme-spring";
    if (currentSem.includes("Summer")) themeClass = "theme-summer";
    if (currentSem.includes("Fall")) themeClass = "theme-fall";

    html += `
                    <div class="semester-block">
                        <div class="semester-header ${themeClass}">
                            <h4>${currentSem}</h4>
                            <span class="sgpa-badge" style="background:rgba(255,255,255,0.2);">Current</span>
                        </div>
                        <table>
                            <thead><tr><th>Code</th><th>Name</th><th>Time</th><th>Room</th><th>Instructor</th><th>Email</th></tr></thead>
                            <tbody>
                `;
    current.forEach((c) => {
      html += `<tr>
                        <td>${c.code}</td>
                        <td>${c.name}</td>
                        <td>${c.schedule}</td>
                        <td>${c.room_number}</td>
                        <td>${c.instructor}</td>
                        <td><small>${c.instructor_email}</small></td>
                    </tr>`;
    });
    html += `</tbody></table></div>`;
  } else {
    html += `<div class="card"><p>No active courses.</p></div>`;
  }

  // --- HISTORY (GROUPED & COLORED) ---
  if (history.length > 0) {
    html += `<h3 style="margin: 40px 0 20px 0; color:#6b7280; font-size:1.1em; border-bottom:2px solid #eee; padding-bottom:10px;">Class History</h3>`;

    // Group by Semester
    const historyBySem = {};
    history.forEach((c) => {
      const sem = c.completed_semester || c.semester || "Unknown";
      if (!historyBySem[sem]) historyBySem[sem] = [];
      historyBySem[sem].push(c);
    });

    Object.keys(historyBySem).forEach((sem) => {
      let themeClass = "theme-default";
      if (sem.includes("Spring")) themeClass = "theme-spring";
      if (sem.includes("Summer")) themeClass = "theme-summer";
      if (sem.includes("Fall")) themeClass = "theme-fall";

      html += `
                        <div class="semester-block">
                            <div class="semester-header ${themeClass}">
                                <h4>${sem}</h4>
                            </div>
                            <table>
                                <thead><tr><th>Code</th><th>Name</th><th>Instructor</th><th>Email</th></tr></thead>
                                <tbody>
                    `;
      historyBySem[sem].forEach((c) => {
        html += `<tr>
                            <td>${c.code}</td>
                            <td>${c.name}</td>
                            <td>${c.instructor}</td>
                            <td><small>${c.instructor_email}</small></td>
                        </tr>`;
      });
      html += `</tbody></table></div>`;
    });
  } else {
    html += `<p style="margin-top:20px; color:#666;">No class history available.</p>`;
  }

  document.getElementById("scheduleTableContainer").innerHTML = html;
}

async function loadGrades() {
  const container = document.getElementById("gradesContainer");
  container.innerHTML = "Loading...";
  const res = await fetch(`${API_URL}/students/${currentStudent.dbId}/grades`);
  const grades = await res.json();

  if (grades.length === 0) {
    container.innerHTML = "No grades found.";
    return;
  }

  const semesters = {};
  grades.forEach((g) => {
    if (!semesters[g.semester]) semesters[g.semester] = [];
    semesters[g.semester].push(g);
  });

  let html = "";
  Object.keys(semesters).forEach((sem) => {
    const semGrades = semesters[sem];
    let semPts = 0,
      semCreds = 0;
    let rows = "";

    semGrades.forEach((g) => {
      const pts = getPoints(g.grade);
      const cr = g.credits || 3;
      semPts += pts * cr;
      semCreds += cr;

      // Style grade badge
      let gradeClass = "grade-C";
      if (g.grade.startsWith("A")) gradeClass = "grade-A";
      if (g.grade.startsWith("B")) gradeClass = "grade-B";

      rows += `<tr>
                        <td style="font-weight:600;">${g.code}</td>
                        <td>${g.course_name}</td>
                        <td>${cr}</td>
                        <td><span class="grade-pill ${gradeClass}">${
        g.grade
      }</span></td>
                        <td>${pts.toFixed(2)}</td>
                    </tr>`;
    });

    const sgpa = semCreds ? (semPts / semCreds).toFixed(2) : "0.00";

    // Color Theme Logic
    let themeClass = "theme-default";
    if (sem.includes("Spring")) themeClass = "theme-spring";
    if (sem.includes("Summer")) themeClass = "theme-summer";
    if (sem.includes("Fall")) themeClass = "theme-fall";

    html += `
                    <div class="semester-block">
                        <div class="semester-header ${themeClass}">
                            <h4>${sem}</h4>
                            <span class="sgpa-badge">SGPA: ${sgpa}</span>
                        </div>
                        <table><thead><tr><th>Code</th><th>Course</th><th>Cr</th><th>Grade</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table>
                    </div>
                `;
  });

  document.getElementById("totalCgpaBadge").innerText =
    "CGPA: " + calculateCGPA(grades);
  container.innerHTML = html;
}

function getPoints(g) {
  const m = {
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };
  return m[g] || 0.0;
}
function calculateCGPA(grades) {
  let pts = 0,
    crs = 0;
  grades.forEach((g) => {
    let c = g.credits || 3;
    pts += getPoints(g.grade) * c;
    crs += c;
  });
  return crs ? (pts / crs).toFixed(2) : "0.00";
}

async function loadAdvising() {
  const res = await fetch(`${API_URL}/advising/courses`);
  const courses = await res.json();
  let html = `<table><thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Action</th></tr></thead><tbody>`;
  courses.forEach(
    (c) =>
      (html += `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td><td><button style="padding:6px 12px; background:#4F46E5; color:white; border:none; border-radius:4px; cursor:pointer;" onclick="alert('Requested!')">Add</button></td></tr>`)
  );
  document.getElementById("advisingListContainer").innerHTML =
    html + "</tbody></table>";
}

async function loadFinancials() {
  const res = await fetch(
    `${API_URL}/students/${currentStudent.dbId}/financials`
  );
  const d = await res.json();
  document.getElementById(
    "financialsContainer"
  ).innerHTML = `<div style="background:#f0fdf4; padding:30px; text-align:center; border-radius:16px; border:1px solid #bbf7d0;"><h2 style="color:#166534; font-size:2.5em; margin:10px 0;">$${d.total}</h2><p style="color:#15803d; font-weight:bold;">Status: ${d.status}</p><p style="color:#666;">Due Date: ${d.dueDate}</p></div>`;
}

async function dropSemester() {
  if (confirm("Drop Semester?")) {
    await fetch(`${API_URL}/students/drop-semester`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: currentStudent.dbId }),
    });
    alert("Semester Dropped.");
    window.location.reload();
  }
}

async function loadAnnouncements() {
  const res = await fetch(`${API_URL}/announcements`);
  const data = await res.json();
  document.getElementById("announcementsList").innerHTML = data
    .map(
      (a) =>
        `<div style="padding:15px; border-bottom:1px solid #f3f4f6;"><div style="font-weight:700; color:#374151; margin-bottom:4px;">${a.title}</div><div style="font-size:0.9em; color:#6b7280; line-height:1.4;">${a.content}</div></div>`
    )
    .join("");
}

function logout() {
  window.location.reload();
}
