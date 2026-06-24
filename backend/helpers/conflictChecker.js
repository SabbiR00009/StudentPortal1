function checkTimeConflict(newCourse, existingCourses) {
  console.log(`\n--- START CONFLICT CHECK FOR ${newCourse.code} ---`);

  // 1. Time Parser
  const parseTime = (str) => {
    if (!str) return null;
    const clean = str.replace(/Slot \d+:/i, "").trim();
    const parts = clean.split("-");
    if (parts.length !== 2) return null;

    const [s, e] = parts.map(t => t.trim());

    const toMin = (t) => {
      let [h, m] = t.split(":").map(Number);

      // 12-HOUR FIX: If hour is 01-07, assume it's PM (Afternoon)
      if (h < 8) h += 12;
      if (h === 12 && t.toLowerCase().includes("am")) h = 0;

      return (h * 60) + (m || 0);
    };

    return { start: toMin(s), end: toMin(e) };
  };

  // 2. Day Normalizer
  const normalizeDays = (input) => {
    if (!input) return [];
    const str = input.toString().trim();
    const map = {
      "M": "Mon", "Mon": "Mon", "Monday": "Mon",
      "T": "Tue", "Tue": "Tue", "Tuesday": "Tue",
      "W": "Wed", "Wed": "Wed", "Wednesday": "Wed",
      "R": "Thu", "Thu": "Thu", "Thursday": "Thu",
      "F": "Fri", "Fri": "Fri", "Friday": "Fri",
      "S": "Sat", "Sat": "Sat", "Saturday": "Sat",
      "U": "Sun", "Sun": "Sun", "Sunday": "Sun",
      "MW": ["Mon", "Wed"], "ST": ["Sun", "Tue"],
      "SR": ["Sun", "Thu"], "TR": ["Tue", "Thu"]
    };

    // Return mapped value or fallback to list split (e.g. "Mon,Wed")
    if (map[str]) return Array.isArray(map[str]) ? map[str] : [map[str]];
    if (str.includes(",")) return str.split(",").map(d => d.trim().substring(0, 3));
    return [str.substring(0, 3)];
  };

  // 3. Get Segments
  const getSegments = (c) => {
    const segments = [];

    // Theory
    if (c.theory_days && c.theory_time) {
      const days = normalizeDays(c.theory_days);
      const time = parseTime(c.theory_time);
      if (time) days.forEach(d => segments.push({ day: d, start: time.start, end: time.end, type: 'Theory' }));
    } else {
      console.log(`[WARN] Course ${c.code} has missing Theory info: Days=${c.theory_days}, Time=${c.theory_time}`);
    }

    // Lab
    if (c.lab_day && c.lab_time) {
      const days = normalizeDays(c.lab_day);
      const time = parseTime(c.lab_time);
      if (time) days.forEach(d => segments.push({ day: d, start: time.start, end: time.end, type: 'Lab' }));
    }
    return segments;
  };

  const newSegments = getSegments(newCourse);
  console.log(`New Course Segments:`, newSegments);

  // 4. Compare
  for (const oldCourse of existingCourses) {
    if (oldCourse.id === newCourse.id) continue;

    const oldSegments = getSegments(oldCourse);
    console.log(`Checking vs Existing ${oldCourse.code}:`, oldSegments);

    for (const newSeg of newSegments) {
      for (const oldSeg of oldSegments) {
        // Check Day
        if (newSeg.day === oldSeg.day) {
          // Check Time
          if ((newSeg.start === oldSeg.start && newSeg.end === oldSeg.end) ||
            (newSeg.start < oldSeg.end && newSeg.end > oldSeg.start)
          ) {
            const msg = `CONFLICT: ${newCourse.code} (${newSeg.type} ${newSeg.start}-${newSeg.end}) hits ${oldCourse.code} (${oldSeg.type} ${oldSeg.start}-${oldSeg.end}) on ${newSeg.day}`;
            console.log("!!! " + msg);
            return { conflict: true, message: msg };
          }
        }
      }
    }
  }

  console.log("--- NO CONFLICT FOUND ---\n");
  return { conflict: false };
}

module.exports = { checkTimeConflict };
