// Static content for the public-facing BIU website. Kept in one place so pages
// stay presentational and content is easy to edit.

export const NAV = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Academics', to: '/academics' },
  { label: 'Admissions', to: '/admissions' },
  { label: 'Research', to: '/research' },
  { label: 'Campus Life', to: '/campus-life' },
  { label: 'News', to: '/news' },
  { label: 'Contact', to: '/contact' },
];

export const SCHOOLS = [
  {
    icon: 'fa-microchip',
    name: 'School of Engineering & Technology',
    blurb: 'Computer science, electrical, civil and mechanical engineering with modern labs and industry projects.',
    programs: [
      'B.Sc. in Computer Science & Engineering',
      'B.Sc. in Electrical & Electronic Engineering',
      'B.Sc. in Civil Engineering',
      'B.Sc. in Software Engineering',
      'M.Sc. in Computer Science',
    ],
  },
  {
    icon: 'fa-chart-line',
    name: 'School of Business',
    blurb: 'AACSB-aligned business education building the next generation of entrepreneurs and leaders.',
    programs: [
      'Bachelor of Business Administration (BBA)',
      'BBA in Finance & Banking',
      'BBA in Marketing',
      'Master of Business Administration (MBA)',
      'Executive MBA',
    ],
  },
  {
    icon: 'fa-book-open',
    name: 'School of Arts & Humanities',
    blurb: 'Language, media, and social sciences that cultivate critical thinking and communication.',
    programs: [
      'B.A. (Hons) in English',
      'B.A. in Media & Journalism',
      'B.S.S. in Economics',
      'B.S.S. in Sociology',
      'M.A. in English',
    ],
  },
  {
    icon: 'fa-flask',
    name: 'School of Science & Health',
    blurb: 'Foundational and applied sciences with a focus on public health and pharmacy.',
    programs: [
      'B.Pharm (Professional)',
      'B.Sc. in Microbiology',
      'B.Sc. in Public Health',
      'B.Sc. in Environmental Science',
      'M.P.H. in Public Health',
    ],
  },
  {
    icon: 'fa-scale-balanced',
    name: 'School of Law',
    blurb: 'Rigorous legal education combining Bangladeshi and international jurisprudence.',
    programs: ['LL.B. (Hons)', 'LL.M.', 'Diploma in Human Rights Law'],
  },
  {
    icon: 'fa-palette',
    name: 'School of Design & Architecture',
    blurb: 'Creative studios blending aesthetics, technology, and the built environment.',
    programs: ['B.Arch (5-year)', 'B.Sc. in Architecture', 'B.A. in Graphic Design'],
  },
];

export const ADMISSION_STEPS = [
  { icon: 'fa-file-lines', title: 'Apply Online', text: 'Create an applicant account and submit the online application form with your academic records.' },
  { icon: 'fa-clipboard-check', title: 'Admission Test & Viva', text: 'Sit for the departmental admission test and a short interview with faculty.' },
  { icon: 'fa-envelope-open-text', title: 'Get Your Offer', text: 'Receive your merit-based offer and scholarship decision within two weeks.' },
  { icon: 'fa-graduation-cap', title: 'Enroll & Register', text: 'Pay admission fees, complete advising, and register for your first semester courses.' },
];

export const TUITION = [
  { program: 'B.Sc. in CSE', admission: '৳ 25,000', perCredit: '৳ 4,500', total: '≈ ৳ 6,50,000' },
  { program: 'BBA', admission: '৳ 20,000', perCredit: '৳ 3,800', total: '≈ ৳ 4,80,000' },
  { program: 'B.A. in English', admission: '৳ 15,000', perCredit: '৳ 3,000', total: '≈ ৳ 3,60,000' },
  { program: 'B.Pharm', admission: '৳ 30,000', perCredit: '৳ 5,200', total: '≈ ৳ 8,90,000' },
  { program: 'LL.B. (Hons)', admission: '৳ 18,000', perCredit: '৳ 3,500', total: '≈ ৳ 4,60,000' },
];

export const NEWS = [
  {
    id: 1,
    category: 'Research',
    date: '2026-06-28',
    title: 'BIU researchers develop low-cost water purification system',
    excerpt: 'A team from the School of Engineering has unveiled an affordable filtration unit aimed at rural communities across Bangladesh.',
  },
  {
    id: 2,
    category: 'Admissions',
    date: '2026-06-20',
    title: 'Fall 2026 admissions now open with expanded scholarships',
    excerpt: 'Applications for the Fall 2026 intake are open, with up to 100% merit scholarships available for outstanding candidates.',
  },
  {
    id: 3,
    category: 'Campus',
    date: '2026-06-12',
    title: 'New Innovation & Entrepreneurship Hub inaugurated',
    excerpt: 'The state-of-the-art hub offers incubation space, mentorship, and seed funding for student-led startups.',
  },
  {
    id: 4,
    category: 'Achievement',
    date: '2026-05-30',
    title: 'BIU debate team wins national inter-university championship',
    excerpt: 'Our debaters brought home the national trophy after a spirited final against 24 competing universities.',
  },
  {
    id: 5,
    category: 'Partnership',
    date: '2026-05-18',
    title: 'MoU signed with leading tech firms for internships',
    excerpt: 'A new industry partnership guarantees internship placements for final-year engineering and business students.',
  },
  {
    id: 6,
    category: 'Events',
    date: '2026-05-05',
    title: 'Annual Convocation 2026 celebrates 2,100 graduates',
    excerpt: 'Families and dignitaries gathered to celebrate the achievements of this year’s graduating class.',
  },
];

export const EVENTS = [
  { day: '15', month: 'JUL', title: 'Open Day & Campus Tour', place: 'Main Auditorium · 10:00 AM' },
  { day: '22', month: 'JUL', title: 'Fall 2026 Admission Test', place: 'Exam Halls · 9:00 AM' },
  { day: '05', month: 'AUG', title: 'Tech Fest & Hackathon', place: 'Engineering Building · All day' },
  { day: '01', month: 'SEP', title: 'Fall Semester Begins', place: 'All Campuses' },
];

export const FACULTY_LEADERS = [
  { name: 'Prof. Dr. Rafiqul Islam', role: 'Vice-Chancellor', dept: 'Computer Science & Engineering' },
  { name: 'Prof. Dr. Kamrul Hasan', role: 'Pro Vice-Chancellor', dept: 'Electrical & Electronic Engineering' },
  { name: 'Dr. Ayesha Siddika', role: 'Dean, School of Engineering', dept: 'Computer Science & Engineering' },
  { name: 'Nusrat Jahan', role: 'Registrar', dept: 'School of Business' },
];

export const CAMPUS_HIGHLIGHTS = [
  { icon: 'fa-book', title: 'Central Library', text: '120,000+ volumes, digital archives, and 24/7 study spaces.' },
  { icon: 'fa-futbol', title: 'Sports Complex', text: 'Indoor and outdoor courts, gymnasium, and a football ground.' },
  { icon: 'fa-people-group', title: '40+ Clubs & Societies', text: 'From robotics and debate to music, drama, and community service.' },
  { icon: 'fa-bed', title: 'Residential Halls', text: 'Safe, modern on-campus accommodation for male and female students.' },
  { icon: 'fa-utensils', title: 'Cafeterias & Food Court', text: 'Affordable, hygienic dining with diverse cuisines.' },
  { icon: 'fa-bus', title: 'Transport Network', text: 'Dedicated bus routes connecting the campus to major city points.' },
];

export const WHY_BIU = [
  { icon: 'fa-award', title: 'UGC Approved', text: 'Fully accredited by the University Grants Commission of Bangladesh.' },
  { icon: 'fa-chalkboard-user', title: 'Expert Faculty', text: 'PhD-qualified faculty from top global and national universities.' },
  { icon: 'fa-handshake', title: 'Industry Links', text: 'Internships and placements with leading employers across sectors.' },
  { icon: 'fa-globe', title: 'Global Exposure', text: 'Exchange programs and partnerships with international universities.' },
];
