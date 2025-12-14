const API_URL = "http://localhost:3000/api";
let currentStudent = null;
let advisingSlip = [];
let pollingInterval = null;
let currentEnrolledCredits = 0;
let loginRole = "student"; // Default role

// =========================================================
// AUTHENTICATION & LOGIN LOGIC (RESTORED)
// =========================================================

function checkAuth() {
  const stored = localStorage.getItem("san_student");
  if (stored) {
    currentStudent = JSON.parse(stored);
    // Ensure dbId is set for backward compatibility
    currentStudent.dbId = currentStudent.id || currentStudent._id;
    showDashboard();
  } else {
    showLanding();
  }
}

// 1. LANDING & LOGIN UI TOGGLE
window.showLanding = function () {
  document.getElementById("landingPage").style.display = "block";
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "none";
  window.scrollTo(0, 0);
};

// restored the "Perfect" logic for toggling UI based on role
window.showLogin = function (role) {
  loginRole = role || "student";

  document.getElementById("landingPage").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("dashboard").style.display = "none";

  const title = document.getElementById("loginTitle");
  const label = document.querySelector("#loginForm label");
  const input = document.getElementById("studentId");
  const errorMsg = document.getElementById("errorMessage");

  if (loginRole === "faculty" || loginRole === "admin") {
    title.innerText = "Faculty & Admin Portal";
    title.style.color = "#ec282bff"; // Purple for Admin
    label.innerText = "Email or Faculty ID";
    input.placeholder = "admin@san.edu / F-CSE-101";
  } else {
    title.innerText = "Student Sign In";
    title.style.color = "#1e3a8a"; // Blue for Student
    label.innerText = "Student ID";
    input.placeholder = "e.g., 2025-3-60-001";
  }

  // Clear inputs
  input.value = "";
  document.getElementById("password").value = "";
  errorMsg.style.display = "none";
  errorMsg.innerText = "";
};

// 2. HANDLE LOGIN (With Redirection)
async function handleLogin(e) {
  e.preventDefault();

  const id = document.getElementById("studentId").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorDisplay = document.getElementById("errorMessage");

  if (!id || !password) {
    errorDisplay.innerText = "Please enter both ID and Password.";
    errorDisplay.style.display = "block";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password, role: loginRole })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      // A. Admin Login
      if (data.userType === "admin") {
        sessionStorage.setItem("adminUser", JSON.stringify(data.user));
        window.location.href = "admin.html";
        return;
      }

      // B. Faculty Login
      if (data.userType === "faculty") {
        sessionStorage.setItem("facultyUser", JSON.stringify(data.user));
        window.location.href = "faculty.html";
        return;
      }

      // C. Student Login
      if (data.userType === "student") {
        currentStudent = data.student;
        currentStudent.dbId = currentStudent.id || currentStudent._id;
        localStorage.setItem("san_student", JSON.stringify(currentStudent));
        showDashboard();
      }
    } else {
      // Show error from server
      errorDisplay.innerText = data.error || "Login failed. Check credentials.";
      errorDisplay.style.display = "block";
    }
  } catch (err) {
    console.error(err);
    errorDisplay.innerText = "Server connection failed.";
    errorDisplay.style.display = "block";
  }
}

function logout() {
  localStorage.removeItem("san_student");
  window.location.href = "index.html";
}

// =========================================================
// DASHBOARD & NAVIGATION
// =========================================================

function showDashboard() {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  document.getElementById("welcomeMessage").innerText = `Welcome back, ${currentStudent.name.split(" ")[0]}!`;
  document.getElementById("userName").innerText = currentStudent.name;
  document.getElementById("userIdDisplay").innerText = "ID: " + currentStudent.student_id;

  const avatarUrl = currentStudent.avatar || `https://ui-avatars.com/api/?name=${currentStudent.name}&background=4F46E5&color=fff`;
  document.getElementById("userAvatar").innerHTML = `<img src="${avatarUrl}" alt="Profile" style="width:100%; height:100%; object-fit:cover; display:block;">`;

  const currentHash = location.hash.replace("#", "") || "home";
  const navBtn = document.querySelector(`.nav-btn[data-view="${currentHash}"]`);
  switchView(currentHash, navBtn, false);

  loadHomeData();
  loadAnnouncements();
}

function switchView(viewName, btn, pushState = true) {
  document.querySelectorAll(".view-section").forEach(el => {
    el.classList.remove("active");
    el.style.display = "none";
  });

  document.querySelectorAll(".nav-btn").forEach(el => el.classList.remove("active"));

  const target = document.getElementById("view-" + viewName);
  if (target) {
    target.style.display = "block";
    setTimeout(() => target.classList.add("active"), 10);
  }

  if (btn) btn.classList.add("active");
  if (pushState) history.pushState({ view: viewName }, "", "#" + viewName);

  if (pollingInterval) clearInterval(pollingInterval);

  if (viewName === "profile") loadProfile();
  if (viewName === "schedule") loadSchedule();
  if (viewName === "grades") loadGrades();
  if (viewName === "financials") loadFinancials();
  if (viewName === "advising") {
    loadAdvisingCatalog();
    pollingInterval = setInterval(loadAdvisingCatalog, 3000);
  }
}

// =========================================================
// DATA LOADERS
// =========================================================

async function loadHomeData() {
  try {
    // 1. Fetch Courses AND Drop Status
    const [courseRes, dropRes] = await Promise.all([
      fetch(`${API_URL}/students/${currentStudent.dbId}/courses`),
      fetch(`${API_URL}/students/drop-status`)
    ]);

    const allCourses = await courseRes.json();
    const dropStatus = await dropRes.json();

    const enrolled = allCourses.filter(c => c.status === 'enrolled');
    const completed = allCourses.filter(c => c.completed_semester);
    const dropped = allCourses.filter(c => c.status === 'dropped' && c.semester === 'Fall-2025');

    currentEnrolledCredits = enrolled.reduce((sum, c) => sum + (c.credits || 0), 0);

    // Stats
    document.getElementById("coursesCount").innerHTML = `${enrolled.length} <small>(${currentEnrolledCredits} Cr)</small>`;
    document.getElementById("creditsCount").innerText = completed.reduce((sum, c) => sum + (c.credits || 0), 0);

    const gradesRes = await fetch(`${API_URL}/students/${currentStudent.dbId}/grades`);
    const grades = await gradesRes.json();
    document.getElementById("gpaDisplay").innerText = calculateCGPA(grades);
    document.getElementById("semestersCount").innerText = new Set(grades.map(g => g.semester)).size;

    // Current Schedule List & Drop Button
    const listContainer = document.getElementById("coursesList");
    const dropBtn = document.getElementById("dropSemesterBtn");

    // --- HANDLE DROP SEMESTER BUTTON ---
    if (dropBtn) {
      if (!dropStatus.allowed) {
        // Drop Window Closed: Disable button & Update text
        dropBtn.disabled = true;
        dropBtn.style.opacity = "0.6";
        dropBtn.style.cursor = "not-allowed";
        dropBtn.innerHTML = `<i class="fas fa-ban"></i> Drop Schedule Ended`;
        dropBtn.title = "The drop period for this semester has closed.";
      } else {
        // Drop Window Open: Normal State
        dropBtn.disabled = false;
        dropBtn.style.opacity = "1";
        dropBtn.style.cursor = "pointer";
        dropBtn.innerHTML = `<i class="fas fa-trash-alt"></i> Drop Semester`;
        dropBtn.title = "";
      }
    }

    if (enrolled.length === 0 && dropped.length > 0) {
      if (dropBtn) { dropBtn.disabled = true; dropBtn.style.opacity = "0.5"; dropBtn.title = "Semester already dropped"; }
      listContainer.innerHTML = `
                <div style="text-align:center; padding:30px; background:#fff1f2; border:1px solid #fda4af; border-radius:10px; color:#9f1239;">
                    <i class="fas fa-ban" style="font-size:2em; margin-bottom:10px;"></i>
                    <h3>You have dropped this semester (Fall-2025)</h3>
                </div>`;
    } else {
      if (enrolled.length > 0) {
        listContainer.innerHTML = enrolled.map(c => `
                    <div style="padding:15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <div style="font-weight:700; color:#374151;">${c.code} - ${c.name}</div>
                            <div style="font-size:0.85em; color:#6b7280;">${formatSchedule(c)}</div>
                            <div style="font-size:0.8em; color:#4F46E5;">Room: ${c.room_number}</div>
                        </div>
                        <span style="background:#e0e7ff; color:#4338ca; padding:4px 10px; border-radius:6px; font-size:0.8em; font-weight:600;">${c.credits} Cr</span>
                    </div>
                `).join("");
      } else {
        listContainer.innerHTML = '<p style="color:#666; font-style:italic; padding:10px;">No enrolled courses.</p>';
      }
    }
  } catch (e) { console.error(e); }
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_URL}/students/${currentStudent.dbId}`);
    const s = await res.json();

    document.getElementById("pName").innerText = s.name;
    document.getElementById("pProgram").innerText = s.program || "N/A";
    document.getElementById("pDept").innerText = s.department;
    document.getElementById("pId").innerText = s.student_id;
    document.getElementById("pUniqueId").innerText = s.unique_id || "N/A";
    document.getElementById("pAdmitted").innerText = s.admitted_semester || "N/A";
    document.getElementById("pDob").innerText = s.dob || "N/A";
    document.getElementById("pBlood").innerText = s.blood_group || "N/A";
    document.getElementById("pNid").innerText = s.nid || "N/A";
    document.getElementById("pMarital").innerText = s.marital_status || "N/A";
    document.getElementById("pEmail").innerText = s.email;
    document.getElementById("pPhone").innerText = s.phone || "N/A";
    document.getElementById("pPresent").innerText = s.present_address || "N/A";
    document.getElementById("pPermanent").innerText = s.permanent_address || "N/A";
    document.getElementById("pAdvisorName").innerText = s.advisor_name || "Not Assigned";
    document.getElementById("pAdvisorEmail").innerText = s.advisor_email || "";

    const gradesRes = await fetch(`${API_URL}/students/${currentStudent.dbId}/grades`);
    const grades = await gradesRes.json();
    const creditsDone = grades.reduce((sum, g) => sum + (g.credits || 0), 0);

    document.getElementById("pCredits").innerText = creditsDone;
    document.getElementById("pCgpa").innerText = calculateCGPA(grades);

  } catch (e) { console.error("Profile load error:", e); }
}

async function loadSchedule() {
  try {
    // 1. Fetch Courses AND Drop Status in parallel
    const [courseRes, dropRes] = await Promise.all([
      fetch(`${API_URL}/students/${currentStudent.dbId}/courses`),
      fetch(`${API_URL}/students/drop-status`)
    ]);

    const allCourses = await courseRes.json();
    const dropStatus = await dropRes.json(); // { allowed: true/false, message: ... }

    const enrolled = allCourses.filter(c => c.status === 'enrolled');
    const history = allCourses.filter(c => c.status !== 'enrolled' && c.status !== 'dropped');

    let html = "";

    // Active Semester Table
    if (enrolled.length > 0) {
      html += `
                <div class="semester-block">
                    <div class="semester-header theme-fall">
                        <h4>Fall-2025 (Current)</h4>
                        <span class="sgpa-badge" style="background:rgba(255,255,255,0.2);">Total: ${currentEnrolledCredits} Cr</span>
                    </div>
                    <table>
                        <thead><tr><th>Code</th><th>Name</th><th>Credits</th><th>Schedule</th><th>Room</th><th>Action</th></tr></thead>
                        <tbody>
                        ${enrolled.map(c => {
        // --- CONDITIONAL ACTION BUTTON ---
        let actionHtml;
        if (dropStatus.allowed) {
          // Show the Button (Standard)
          actionHtml = `<button class="remove-btn" onclick="dropCourse(${c.id})"><i class="fas fa-minus-circle"></i></button>`;
        } else {
          // Show the Message
          actionHtml = `<span style="font-size:0.8em; color:#dc2626; font-weight:600; background:#fee2e2; padding:4px 8px; border-radius:4px;">Drop Ended</span>`;
        }

        return `
                            <tr>
                                <td>${c.code}</td>
                                <td>${c.name}</td>
                                <td>${c.credits}</td>
                                <td>${formatSchedule(c)}</td>
                                <td>${c.room_number}</td>
                                <td>${actionHtml}</td>
                            </tr>
                            `;
      }).join('')}
                        </tbody>
                    </table>
                </div>`;
    } else {
      html += '<div class="card"><p>No active courses this semester.</p></div>';
    }

    // History (No changes needed here)
    if (history.length > 0) {
      html += '<h3 style="margin:30px 0 10px 0; color:#6b7280; border-bottom:1px solid #eee; padding-bottom:10px;">Course History</h3>';
      const grouped = {};
      history.forEach(c => {
        const sem = c.completed_semester || c.semester || "Unknown";
        if (!grouped[sem]) grouped[sem] = [];
        grouped[sem].push(c);
      });

      Object.keys(grouped).forEach(sem => {
        html += `
                <div class="semester-block">
                    <div class="semester-header theme-default"><h4>${sem}</h4></div>
                    <table>
                        <thead><tr><th>Code</th><th>Name</th><th>Cr</th><th>Instructor</th></tr></thead>
                        <tbody>
                        ${grouped[sem].map(c => `
                            <tr><td>${c.code}</td><td>${c.name}</td><td>${c.credits}</td><td>${c.instructor}</td></tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>`;
      });
    }
    document.getElementById("scheduleTableContainer").innerHTML = html;
  } catch (e) { console.error(e); }
}

async function loadGrades() {
  const container = document.getElementById("gradesContainer");
  container.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_URL}/students/${currentStudent.dbId}/grades`);
    const grades = await res.json();

    if (grades.length === 0) { container.innerHTML = "<p>No grades published yet.</p>"; return; }

    const grouped = {};
    grades.forEach(g => {
      if (!grouped[g.semester]) grouped[g.semester] = [];
      grouped[g.semester].push(g);
    });

    let html = "";
    Object.keys(grouped).forEach(sem => {
      const semGrades = grouped[sem];
      let totalPoints = 0, totalCr = 0;
      const rows = semGrades.map(g => {
        totalPoints += (g.point * g.credits);
        totalCr += g.credits;
        let gradeClass = g.grade.startsWith('A') ? 'grade-A' : (g.grade.startsWith('B') ? 'grade-B' : 'grade-C');
        if (g.grade === 'F') gradeClass = 'grade-F';

        return `<tr><td>${g.code}</td><td>${g.course_name}</td><td>${g.credits}</td><td>${g.marks || '-'}</td><td><span class="grade-pill ${gradeClass}">${g.grade}</span></td><td><b>${g.point.toFixed(2)}</b></td></tr>`;
      }).join("");

      const sgpa = totalCr ? (totalPoints / totalCr).toFixed(2) : "0.00";
      html += `<div class="semester-block"><div class="semester-header theme-default"><h4>${sem}</h4><span class="sgpa-badge">SGPA: ${sgpa}</span></div><table><thead><tr><th>Code</th><th>Course</th><th>Cr</th><th>Marks</th><th>Grade</th><th>Point</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    });
    document.getElementById("totalCgpaBadge").innerText = "CGPA: " + calculateCGPA(grades);
    container.innerHTML = html;
  } catch (e) { console.error(e); }
}

async function loadFinancials() {
  const container = document.getElementById("financialsContainer");
  container.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_URL}/students/${currentStudent.dbId}/financials`);
    const data = await res.json();

    const isPaid = data.status === 'Paid';
    const statusColor = isPaid ? 'green' : (data.status === 'Refunded' ? 'gray' : '#dc2626');
    const bg = isPaid ? '#f0fdf4' : '#fff7ed';

    container.innerHTML = `
        <div style="background:${bg}; border-radius:12px; padding:25px; border:1px solid ${isPaid ? '#bbf7d0' : '#fed7aa'}">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:15px; margin-bottom:15px;">
                <div><h2 style="margin:0; color:#374151;">Financial Overview</h2><p style="margin:0; color:#6b7280; font-size:0.9em;">Semester: Fall-2025</p></div>
                <div style="text-align:right;"><span style="display:inline-block; padding:5px 12px; background:${statusColor}; color:white; border-radius:20px; font-weight:bold; font-size:0.9em;">${data.status}</span><div style="margin-top:5px; font-size:0.8em; color:#666;">Due: ${data.dueDate}</div></div>
            </div>
            <table style="width:100%; font-size:0.95em;">
                <tr><td style="padding:8px 0; color:#4b5563;">Previous Dues:</td><td style="padding:8px 0; text-align:right; font-weight:bold;">$${data.previous_due}</td></tr>
                <tr><td style="padding:8px 0; color:#4b5563;">Current Tuition (${data.credits} Cr):</td><td style="padding:8px 0; text-align:right; font-weight:bold;">$${data.current_charges}</td></tr>
                <tr style="border-top:2px solid rgba(0,0,0,0.1);"><td style="padding:15px 0; font-size:1.1em; font-weight:bold;">Total Payable:</td><td style="padding:15px 0; text-align:right; font-size:1.4em; font-weight:900; color:#1f2937;">$${data.total_payable}</td></tr>
            </table>
        </div>`;
  } catch (e) { container.innerHTML = "Error loading financials."; }
}

async function loadAdvisingCatalog() {
  try {
    const gateRes = await fetch(`${API_URL}/advising/check-access/${currentStudent.dbId}`);
    const gateData = await gateRes.json();
    const catalogDiv = document.getElementById("advisingCatalog");

    if (!gateData.allowed) {
      catalogDiv.innerHTML = `<div style="text-align:center; padding:40px; background:#fff1f2; border:1px solid #fda4af; border-radius:10px;"><i class="fas fa-lock" style="font-size:2em; color:#e11d48; margin-bottom:15px;"></i><h3 style="color:#9f1239;">Advising Locked</h3><p>${gateData.message}</p></div>`;
      document.getElementById("confirmSlipBtn").disabled = true;
      return;
    }

    document.getElementById("confirmSlipBtn").disabled = false;
    const dept = document.getElementById("advDeptFilter").value;
    const sem = document.getElementById("advSemFilter").value;

    const [catRes, myRes] = await Promise.all([
      fetch(`${API_URL}/advising/courses?dept=${dept}&semester=${sem}`),
      fetch(`${API_URL}/students/${currentStudent.dbId}/courses`)
    ]);

    const catalog = await catRes.json();
    const myCourses = await myRes.json();
    const enrolledCodes = myCourses.filter(c => c.status === 'enrolled').map(c => c.code);
    const available = catalog.filter(c => !enrolledCodes.includes(c.code));

    let html = "";
    if (available.length === 0) {
      html = "<p style='text-align:center; padding:20px;'>No courses available.</p>";
    } else {
      html = available.map(c => {
        const isFull = c.seats_available <= 0;
        const inSlip = advisingSlip.find(s => s.id === c.id);
        let btnState = "", btnText = "Add", seatClass = "seat-open";
        if (inSlip) { btnState = "disabled"; btnText = "In Slip"; }
        else if (isFull) { btnState = "disabled"; btnText = "Full"; seatClass = "seat-full"; }

        return `
                <div class="catalog-item">
                    <div class="catalog-info">
                        <strong>${c.code} ${c.name}</strong>
                        <div class="catalog-meta">
                            <span><i class="fas fa-clock"></i> ${formatSchedule(c)}</span>
                            <span><i class="fas fa-user"></i> ${c.instructor}</span>
                            <span><i class="fas fa-star"></i> ${c.credits} Cr</span>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <span class="seat-badge ${seatClass}">${c.seats_available} Seats</span>
                        <div style="margin-top:5px;"><button class="add-btn" onclick="addToSlip(${c.id}, '${c.code}', '${c.name.replace(/'/g, "\\'")}', ${c.credits})" ${btnState}><i class="fas fa-plus"></i> ${btnText}</button></div>
                    </div>
                </div>`;
      }).join("");
    }
    catalogDiv.innerHTML = html;
  } catch (e) { console.error(e); }
}

function formatSchedule(c) {
  let s = `${c.theory_days} ${c.theory_time}`;
  if (c.lab_day) s += ` <br><span style="font-size:0.9em; color:#d97706;">Lab: ${c.lab_day} ${c.lab_time}</span>`;
  return s;
}

function calculateCGPA(grades) {
  let totalPts = 0, totalCr = 0;
  grades.forEach(g => {
    const pts = (typeof g.point === 'number') ? g.point : 0;
    totalPts += (pts * g.credits);
    totalCr += g.credits;
  });
  return totalCr ? (totalPts / totalCr).toFixed(2) : "0.00";
}

// SLIP ACTIONS
async function addToSlip(id, code, name, credits) {
  // 1. Basic Client Checks (Instant feedback)
  if (advisingSlip.find(s => s.id === id)) return;

  const slipCredits = advisingSlip.reduce((sum, s) => sum + s.credits, 0);
  if (currentEnrolledCredits + slipCredits + credits > 15) {
    return alert("Credit Limit Exceeded! Max 15 credits.");
  }

  // 2. Prepare Data for Server
  const slipIds = advisingSlip.map(s => s.id);

  // 3. Server Validation (The "Pre-Check")
  try {
    const res = await fetch(`${API_URL}/advising/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: currentStudent.dbId,
        courseId: id,
        slipIds: slipIds
      })
    });

    const data = await res.json();

    // 4. Handle Result
    if (!data.success) {
      // STOP! Show the conflict error immediately
      alert("🚫 Cannot Add Course:\n\n" + data.error);
      return;
    }

    // 5. Success! Add to Slip visually
    advisingSlip.push({ id, code, name, credits });
    renderSlip();
    loadAdvisingCatalog(); // Update button states

  } catch (e) {
    console.error(e);
    alert("Server validation failed. Please try again.");
  }
}

function removeFromSlip(id) {
  advisingSlip = advisingSlip.filter(s => s.id !== id);
  renderSlip();
  loadAdvisingCatalog();
}

function renderSlip() {
  const list = document.getElementById("advisingSlipList");
  const totalEl = document.getElementById("slipTotalCredits");
  if (advisingSlip.length === 0) { list.innerHTML = '<div class="empty-state"><p>Slip is empty.</p></div>'; totalEl.innerText = "0"; return; }
  const total = advisingSlip.reduce((sum, s) => sum + s.credits, 0);
  totalEl.innerText = total;
  list.innerHTML = advisingSlip.map(s => `<div class="slip-item"><div><strong>${s.code}</strong> (${s.credits} Cr)</div><button class="remove-btn" onclick="removeFromSlip(${s.id})"><i class="fas fa-times"></i></button></div>`).join("");
}

async function confirmAdvisingSlip() {
  if (advisingSlip.length === 0) return alert("Slip is empty.");
  const courseIds = advisingSlip.map(s => s.id);
  try {
    const res = await fetch(`${API_URL}/advising/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: currentStudent.dbId, courseIds }) });
    const data = await res.json();
    if (data.success) {
      alert("✅ Enrolled Successfully!");
      advisingSlip = [];
      renderSlip();
      loadHomeData();
      loadAdvisingCatalog();
      switchView('schedule', document.querySelector('.nav-btn[data-view="schedule"]'));
    } else { alert("❌ Failed: " + data.message); }
  } catch (e) { alert("Server connection failed."); }
}

async function dropCourse(courseId) {
  if (!confirm("Are you sure you want to DROP this course?")) return;
  try {
    const res = await fetch(`${API_URL}/students/drop-course`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: currentStudent.dbId, courseId }) });
    const data = await res.json();
    if (data.success) { alert("Course Dropped."); loadHomeData(); loadSchedule(); } else { alert(data.error); }
  } catch (e) { alert("Error"); }
}

async function dropSemester() {
  if (!confirm("WARNING: Drop ENTIRE Semester? This removes ALL courses.")) return;
  try {
    await fetch(`${API_URL}/students/drop-semester`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: currentStudent.dbId }) });
    alert("Semester Dropped."); loadHomeData(); loadSchedule();
  } catch (e) { alert("Error"); }
}

async function loadAnnouncements() {
  const res = await fetch(API_URL + "/announcements");
  const data = await res.json();
  document.getElementById("announcementsList").innerHTML = data.map(e => `<div style="padding:15px; border-bottom:1px solid #f3f4f6;"><div style="font-weight:700; color:#374151; margin-bottom:4px;">${e.title}</div><div style="font-size:0.9em; color:#6b7280; line-height:1.4;">${e.content}</div></div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  // 1. Auth Check
  checkAuth();

  // 2. Login Form Listener
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  // 3. Global Button Listeners
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const dropBtn = document.getElementById("dropSemesterBtn");
  if (dropBtn) dropBtn.addEventListener("click", dropSemester);

  const confirmSlipBtn = document.getElementById("confirmSlipBtn");
  if (confirmSlipBtn) confirmSlipBtn.addEventListener("click", confirmAdvisingSlip);

  // 4. Navigation Menu Buttons
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      // Prevent default anchor behavior if any
      e.preventDefault();
      const view = btn.getAttribute("data-view");
      if (view) switchView(view, btn, true); // true = add to history
    });
  });

  // 5. FIX: Dashboard Cards (Click to Navigate)
  document.querySelectorAll(".stat-card").forEach(card => {
    card.addEventListener("click", () => {
      const targetView = card.getAttribute("data-target");
      if (targetView) {
        // Find the corresponding nav button to highlight it
        const navBtn = document.querySelector(`.nav-btn[data-view="${targetView}"]`);
        switchView(targetView, navBtn, true);
      }
    });
  });

  // 6. FIX: Browser Back/Forward Button
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.view) {
      // Switch view BUT do not push state (false)
      // We pass null for the button because we don't need to re-click it, just highlight it
      const navBtn = document.querySelector(`.nav-btn[data-view="${event.state.view}"]`);
      switchView(event.state.view, navBtn, false);
    } else {
      // Default to home if no state exists
      if (currentStudent) {
        switchView("home", document.querySelector(`.nav-btn[data-view="home"]`), false);
      } else {
        showLanding();
      }
    }
  });

  // 7. Logo Click -> Home
  const logo = document.getElementById("navLogo");
  if (logo) {
    logo.addEventListener("click", () => {
      const homeBtn = document.querySelector(`.nav-btn[data-view="home"]`);
      switchView("home", homeBtn, true);
    });
  }

  // 8. Landing Page Helper (If refreshed on landing)
  if (!localStorage.getItem("san_student")) {
    showLanding();
  }
});