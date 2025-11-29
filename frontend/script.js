const API_URL = "http://localhost:3000/api";
let currentStudent = null;
let advisingSlip = []; // Local cart for courses
let pollingInterval = null; // Timer for seat updates
let currentEnrolledCredits = 0; // Track credits for validation

// --- 0. AUTO-FIX CSS (Self-Healing) ---
(function fixStyles() {
  if (!document.querySelector('link[rel="stylesheet"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "styles.css";
    document.head.appendChild(link);
    const fa = document.createElement("link");
    fa.rel = "stylesheet";
    fa.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(fa);
  }
})();

// --- HISTORY MANAGEMENT ---
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.view) {
    switchView(event.state.view, null, false);
  } else {
    if (currentStudent) switchView("home", null, false);
  }
});

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  // Navigation Buttons: Exclude the drop button to prevent event hijacking
  const navBtns = document.querySelectorAll(".nav-btn:not(#dropSemesterBtn)");
  navBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopImmediatePropagation();
      let viewName = btn.getAttribute("data-view");
      if (!viewName && btn.id.startsWith("btn-"))
        viewName = btn.id.replace("btn-", "");
      if (viewName) switchView(viewName, btn);
    });
  });

  const statCards = document.querySelectorAll(".stat-card");
  statCards.forEach((card) => {
    card.addEventListener("click", () => {
      const target = card.getAttribute("data-target");
      if (target) {
        const btn =
          document.querySelector(`.nav-btn[data-view="${target}"]`) ||
          document.getElementById(`btn-${target}`);
        switchView(target, btn);
      }
    });
  });

  const confirmBtn = document.getElementById("confirmSlipBtn");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmAdvisingSlip);

  const dropBtn = document.getElementById("dropSemesterBtn");
  if (dropBtn) dropBtn.addEventListener("click", dropSemester);
});

// --- AUTHENTICATION ---
async function handleLogin(e) {
  e.preventDefault();
  const studentId = document.getElementById("studentId").value;
  const password = document.getElementById("password").value;
  const errEl = document.getElementById("errorMessage");

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, password }),
    });
    const data = await res.json();

    if (res.ok) {
      currentStudent = data.student;
      currentStudent.dbId = data.student.id || data.student._id;
      showDashboard();
    } else {
      errEl.innerText = data.error || "Login failed";
      errEl.style.display = "block";
    }
  } catch (e) {
    errEl.innerText = "Server Connection Failed.";
    errEl.style.display = "block";
  }
}

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

  const initialView = location.hash.replace("#", "") || "home";
  const initialBtn = document.querySelector(
    `.nav-btn[data-view="${initialView}"]`
  );
  switchView(initialView, initialBtn, false);

  loadHomeData();
  loadAnnouncements();
}

function switchView(viewName, btn, updateHistory = true) {
  document.querySelectorAll(".view-section").forEach((el) => {
    el.classList.remove("active");
    el.style.display = "none";
  });
  document
    .querySelectorAll(".nav-btn")
    .forEach((el) => el.classList.remove("active"));

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.style.display = "block";
    setTimeout(() => targetView.classList.add("active"), 10);
  }

  if (btn) btn.classList.add("active");

  if (updateHistory) history.pushState({ view: viewName }, "", `#${viewName}`);

  if (pollingInterval) clearInterval(pollingInterval);

  if (viewName === "schedule") loadSchedule();
  if (viewName === "grades") loadGrades();
  if (viewName === "financials") loadFinancials();

  if (viewName === "advising") {
    loadAdvisingCatalog();
    pollingInterval = setInterval(loadAdvisingCatalog, 3000);
  }
}

// --- CORE DATA ---
async function loadHomeData() {
  try {
    const res = await fetch(
      `${API_URL}/students/${currentStudent.dbId}/courses`
    );
    const courses = await res.json();

    const currentCourses = courses.filter((c) => c.status === "enrolled");
    const completedCourses = courses.filter(
      (c) => c.status !== "enrolled" && c.status !== "dropped"
    );
    const droppedCourses = courses.filter(
      (c) => c.status === "dropped" && c.semester === "Fall-2025"
    );

    currentEnrolledCredits = currentCourses.reduce(
      (sum, c) => sum + (c.credits || 0),
      0
    );

    document.getElementById("coursesCount").innerText = currentCourses.length;
    document.getElementById("creditsCount").innerText = completedCourses.reduce(
      (sum, c) => sum + (c.credits || 0),
      0
    );

    const gRes = await fetch(
      `${API_URL}/students/${currentStudent.dbId}/grades`
    );
    const grades = await gRes.json();
    document.getElementById("gpaDisplay").innerText = calculateCGPA(grades);
    document.getElementById("semestersCount").innerText = new Set(
      grades.map((g) => g.semester)
    ).size;

    const listContainer = document.getElementById("coursesList");

    if (currentCourses.length > 0) {
      listContainer.innerHTML = currentCourses
        .map(
          (c) => `
            <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-weight:700; color:#374151;">${c.code} - ${c.name}</div>
                    <div style="font-size:0.85em; color:#6b7280; margin-top:2px;">${c.schedule} • ${c.room_number}</div>
                </div>
                <span style="background:#e0e7ff; color:#4338ca; padding:4px 10px; border-radius:6px; font-size:0.8em; font-weight:600;">${c.credits} Cr</span>
            </div>
        `
        )
        .join("");
    } else if (droppedCourses.length > 0) {
      // SHOW DROPPED SEMESTER MESSAGE
      listContainer.innerHTML = `
            <div style="text-align:center; padding:30px; background:#fff1f2; border:1px solid #fda4af; border-radius:10px; color:#9f1239;">
                <i class="fas fa-ban" style="font-size:2em; margin-bottom:10px;"></i>
                <h3 style="margin:0; font-size:1.2em;">You have dropped this semester (Fall-2025)</h3>
                <p style="margin:5px 0 0 0; font-size:0.9em;">All courses have been removed. Tuition has been refunded.</p>
            </div>
        `;
    } else {
      listContainer.innerHTML =
        '<p style="color:#666; font-style:italic; padding:10px;">No enrolled courses for this semester.</p>';
    }
  } catch (error) {
    console.error(error);
  }
}

// --- ADVANCED ADVISING MODULE ---

async function loadAdvisingCatalog() {
  try {
    // 1. Fetch Catalog & History in parallel
    const [catRes, myRes] = await Promise.all([
      fetch(`${API_URL}/advising/courses`),
      fetch(`${API_URL}/students/${currentStudent.dbId}/courses`),
    ]);

    const allCatalog = await catRes.json();
    const myHistory = await myRes.json();

    // 2. Identify Lists
    const enrolledCodes = myHistory
      .filter((c) => c.status === "enrolled")
      .map((c) => c.code);
    const completedCodes = myHistory
      .filter((c) => c.status !== "enrolled" && c.status !== "dropped")
      .map((c) => c.code);

    // 3. Filter Logic
    // Undone: In catalog, NOT in history, NOT currently enrolled
    const undoneCourses = allCatalog.filter(
      (c) => !completedCodes.includes(c.code) && !enrolledCodes.includes(c.code)
    );

    // Retake: In history (completed/dropped) AND NOT currently enrolled
    const retakeCourses = allCatalog.filter(
      (c) => completedCodes.includes(c.code) && !enrolledCodes.includes(c.code)
    );

    const container = document.getElementById("advisingCatalog");
    if (!container) return;

    let html = "";

    // Helper to render a list
    const renderList = (list, title, badgeColor) => {
      if (list.length === 0)
        return `<h4 style="margin-top:20px; color:#666;">${title}</h4><p style="font-style:italic; color:#888; margin-bottom:20px;">No courses available.</p>`;

      let sectionHtml = `<h4 style="margin-top:20px; margin-bottom:10px; color:#4F46E5; border-bottom:1px solid #eee; padding-bottom:5px;">${title}</h4>`;

      sectionHtml += list
        .map((c) => {
          const isFull = c.seats_available <= 0;
          const inSlip = advisingSlip.find((s) => s.id === c.id);

          let btnDisabled = isFull || inSlip ? "disabled" : "";
          let btnText = inSlip ? "In Slip" : isFull ? "Full" : "Add";
          let badgeClass = isFull ? "seat-full" : "seat-open";

          const code = c.code;
          const name = c.name.replace(/'/g, "\\'");

          return `
            <div class="catalog-item" style="border-left: 4px solid ${badgeColor};">
                <div class="catalog-info">
                    <strong>${c.code} ${c.name}</strong>
                    <div class="catalog-meta">
                        <span><i class="fas fa-clock"></i> ${c.schedule}</span>
                        <span><i class="fas fa-chalkboard-teacher"></i> ${c.instructor}</span>
                        <span><i class="fas fa-star"></i> ${c.credits} Cr</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="margin-bottom:5px;"><span class="seat-badge ${badgeClass}">${c.seats_available} Seats</span></div>
                    <button class="add-btn" onclick="addToSlip(${c.id}, '${code}', '${name}', ${c.credits})" ${btnDisabled}>${btnText}</button>
                </div>
            </div>`;
        })
        .join("");
      return sectionHtml;
    };

    // Render Sections
    html += renderList(undoneCourses, "Regular Courses (Undone)", "#4F46E5");
    html += renderList(retakeCourses, "Retake Courses", "#F59E0B"); // Orange for retakes

    container.innerHTML = html;
  } catch (error) {
    console.error("Advising error:", error);
  }
}

function addToSlip(id, code, name, credits) {
  if (advisingSlip.find((c) => c.id === id)) return;

  // --- MAX CREDIT VALIDATION (15) ---
  const slipCredits = advisingSlip.reduce((sum, c) => sum + c.credits, 0);
  const totalProjected = currentEnrolledCredits + slipCredits + credits;

  if (totalProjected > 15) {
    alert(
      `Credit Limit Exceeded!\n\nCurrent Enrolled: ${currentEnrolledCredits}\nIn Slip: ${slipCredits}\nAdding: ${credits}\nTotal Projected: ${totalProjected}\n\nMaximum allowed is 15 credits per semester.`
    );
    return;
  }

  advisingSlip.push({ id, code, name, credits });
  renderSlip();
  loadAdvisingCatalog();
}

function removeFromSlip(id) {
  advisingSlip = advisingSlip.filter((c) => c.id !== id);
  renderSlip();
  loadAdvisingCatalog();
}

function renderSlip() {
  const list = document.getElementById("advisingSlipList");
  if (!list) return;

  const totalCredits = advisingSlip.reduce((sum, c) => sum + c.credits, 0);
  const projectedTotal = currentEnrolledCredits + totalCredits;

  document.getElementById("slipTotalCredits").innerText = totalCredits;
  // Show projection in slip
  document.getElementById(
    "slipTotalCredits"
  ).innerHTML = `${totalCredits} <small style="color:#666; font-weight:normal; font-size:0.8em;">(New Total: ${projectedTotal})</small>`;

  if (advisingSlip.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><i class="fas fa-shopping-basket"></i><p>Slip is empty.</p></div>';
    return;
  }

  list.innerHTML = advisingSlip
    .map(
      (c) => `
        <div class="slip-item">
            <div><strong>${c.code}</strong> <small>(${c.credits} Cr)</small><br><small>${c.name}</small></div>
            <button class="remove-btn" onclick="removeFromSlip(${c.id})"><i class="fas fa-times"></i></button>
        </div>
    `
    )
    .join("");
}

async function confirmAdvisingSlip() {
  if (advisingSlip.length === 0) return alert("Advising slip is empty.");

  const slipCredits = advisingSlip.reduce((sum, c) => sum + c.credits, 0);
  const totalProjected = currentEnrolledCredits + slipCredits;

  // --- MIN CREDIT CHECK (9) ---
  if (totalProjected < 9) {
    alert(
      `Registration Failed: Minimum Credit Requirement Not Met.\n\nCurrent Enrolled: ${currentEnrolledCredits}\nIn Slip: ${slipCredits}\nTotal Projected: ${totalProjected}\n\nYou must take at least 9 credits.`
    );
    return;
  }

  const courseIds = advisingSlip.map((c) => c.id);

  try {
    const res = await fetch(`${API_URL}/advising/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: currentStudent.dbId, courseIds }),
    });
    const data = await res.json();

    if (data.success) {
      alert("Registration Successful! Please proceed to payment.");
      advisingSlip = [];
      renderSlip();
      loadHomeData(); // Refresh enrolled credits count
      loadAdvisingCatalog();

      // Redirect to Financials to prompt payment
      const finBtn = document.querySelector('.nav-btn[data-view="financials"]');
      if (finBtn) switchView("financials", finBtn);
    } else {
      alert("Error: " + data.message);
    }
  } catch (e) {
    alert("Registration failed.");
  }
}

// --- OTHER FUNCTIONS ---
async function loadSchedule() {
  try {
    const res = await fetch(
      `${API_URL}/students/${currentStudent.dbId}/courses`
    );
    const courses = await res.json();
    const current = courses.filter((c) => c.status === "enrolled");
    const history = courses.filter((c) => c.status !== "enrolled");

    // Calculate current credits for display in schedule
    const currentCredits = current.reduce(
      (sum, c) => sum + (c.credits || 0),
      0
    );

    let html = "";

    // Current
    if (current.length > 0) {
      const currentSem = current[0].semester || "Fall-2025 (Current)";
      let themeClass = "theme-default";
      if (currentSem.includes("Spring")) themeClass = "theme-spring";
      if (currentSem.includes("Summer")) themeClass = "theme-summer";
      if (currentSem.includes("Fall")) themeClass = "theme-fall";

      html += `
        <div class="semester-block">
            <div class="semester-header ${themeClass}">
                <h4>${currentSem}</h4>
                <span class="sgpa-badge" style="background:rgba(255,255,255,0.2);">Current: ${currentCredits} Credits</span>
            </div>
            <table>
                <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Time</th><th>Room</th><th>Instructor</th><th>Action</th></tr></thead>
                <tbody>
      `;
      current.forEach((c) => {
        html += `<tr>
            <td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td><td>${c.schedule}</td><td>${c.room_number}</td><td>${c.instructor}</td>
            <td><button class="remove-btn" onclick="dropCourse(${c.id})" title="Drop"><i class="fas fa-minus-circle"></i></button></td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
    } else {
      html += `<div class="card"><p>No active courses.</p></div>`;
    }

    // History
    if (history.length > 0) {
      html += `<h3 style="margin: 40px 0 20px 0; color:#6b7280; font-size:1.1em; border-bottom:2px solid #eee; padding-bottom:10px;">Class History</h3>`;
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

        html += `<div class="semester-block"><div class="semester-header ${themeClass}"><h4>${sem}</h4></div><table><thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Instructor</th><th>Email</th></tr></thead><tbody>`;
        historyBySem[sem].forEach((c) => {
          html += `<tr><td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td><td>${c.instructor}</td><td><small>${c.instructor_email}</small></td></tr>`;
        });
        html += `</tbody></table></div>`;
      });
    }
    document.getElementById("scheduleTableContainer").innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

// --- SAFE DROP: Prevents accidental drops & respects min credits ---
async function dropCourse(courseId) {
  // 1. Require explicit confirmation word
  const confirmation = prompt(
    "SECURITY CHECK:\n\nTo confirm dropping this course, type 'DROP' below.\n\nWarning: This action is irreversible and fees may apply."
  );

  if (confirmation !== "DROP") {
    alert("Drop cancelled. You must type 'DROP' (all caps) to confirm.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/students/drop-course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: currentStudent.dbId,
        courseId: courseId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Course Dropped Successfully.");
      loadSchedule();
      loadHomeData();
    } else {
      alert("Drop Failed: " + data.error);
    }
  } catch (e) {
    alert("Drop failed. Server error.");
  }
}

async function loadGrades() {
  const container = document.getElementById("gradesContainer");
  container.innerHTML = "Loading...";
  try {
    const res = await fetch(
      `${API_URL}/students/${currentStudent.dbId}/grades`
    );
    const grades = await res.json();
    if (grades.length === 0) {
      container.innerHTML = "No grades.";
      return;
    }

    const semesters = {};
    grades.forEach((g) => {
      if (!semesters[g.semester]) semesters[g.semester] = [];
      semesters[g.semester].push(g);
    });

    let html = "";
    Object.keys(semesters).forEach((sem) => {
      let semPts = 0,
        semCreds = 0;
      let rows = semesters[sem]
        .map((g) => {
          const pts = getPoints(g.grade);
          const cr = g.credits || 3;
          semPts += pts * cr;
          semCreds += cr;
          let gradeClass = g.grade.startsWith("A")
            ? "grade-A"
            : g.grade.startsWith("B")
            ? "grade-B"
            : "grade-C";
          return `<tr><td>${g.code}</td><td>${
            g.course_name
          }</td><td>${cr}</td><td><span class="grade-pill ${gradeClass}">${
            g.grade
          }</span></td><td>${pts.toFixed(2)}</td></tr>`;
        })
        .join("");

      const sgpa = semCreds ? (semPts / semCreds).toFixed(2) : "0.00";
      let themeClass = sem.includes("Spring")
        ? "theme-spring"
        : sem.includes("Summer")
        ? "theme-summer"
        : "theme-fall";
      html += `<div class="semester-block"><div class="semester-header ${themeClass}"><h4>${sem}</h4><span class="sgpa-badge">SGPA: ${sgpa}</span></div><table><thead><tr><th>Code</th><th>Course</th><th>Cr</th><th>Grade</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    });
    document.getElementById("totalCgpaBadge").innerText =
      "CGPA: " + calculateCGPA(grades);
    container.innerHTML = html;
  } catch (error) {
    console.error(error);
  }
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

async function loadFinancials() {
  const res = await fetch(
    `${API_URL}/students/${currentStudent.dbId}/financials`
  );
  const d = await res.json();

  // Check if semester is dropped
  const courseRes = await fetch(
    `${API_URL}/students/${currentStudent.dbId}/courses`
  );
  const courses = await courseRes.json();
  const droppedCurrent = courses.filter(
    (c) => c.status === "dropped" && c.semester === "Fall-2025"
  );
  const enrolledCurrent = courses.filter((c) => c.status === "enrolled");

  let amount = d.total;
  let status = d.status;

  if (enrolledCurrent.length === 0 && droppedCurrent.length > 0) {
    amount = 0;
    status = "Refunded";
  }

  document.getElementById(
    "financialsContainer"
  ).innerHTML = `<div style="background:#f0fdf4; padding:30px; text-align:center; border-radius:16px; border:1px solid #bbf7d0;"><h2 style="color:#166534; font-size:2.5em; margin:10px 0;">$${amount}</h2><p style="color:#15803d; font-weight:bold;">Status: ${status}</p><p style="color:#666;">Due Date: ${d.dueDate}</p></div>`;
}

// Safe Drop Semester
async function dropSemester() {
  const confirmation = prompt(
    "SECURITY CHECK:\n\nTo confirm dropping the ENTIRE SEMESTER, type 'DROP' below.\n\nThis will remove ALL enrolled courses."
  );

  if (confirmation !== "DROP") {
    alert("Drop cancelled. You must type 'DROP' (all caps) to confirm.");
    return;
  }

  await fetch(`${API_URL}/students/drop-semester`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId: currentStudent.dbId }),
  });
  alert("Semester Dropped.");

  // Instead of reload, refresh data view
  loadHomeData();
  loadSchedule();
  switchView("home", document.querySelector('.nav-btn[data-view="home"]'));
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
