export const DEFAULT_FACULTY_ADVISORS = [
  {
    id: 'fac-1',
    name: 'Dr. Alan Turing',
    email: 'alan.turing@mitc.edu',
    designation: 'Professor & CSE Head Advisor',
    phone: '9876500001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'fac-2',
    name: 'Dr. Grace Hopper',
    email: 'grace.hopper@mitc.edu',
    designation: 'Associate Professor & Class Counselor',
    phone: '9876500002',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'fac-3',
    name: 'Prof. Donald Knuth',
    email: 'donald.knuth@mitc.edu',
    designation: 'Assistant Professor & Section In-Charge',
    phone: '9876500003',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'fac-4',
    name: 'Dr. Barbara Liskov',
    email: 'barbara.liskov@mitc.edu',
    designation: 'Senior Faculty & Academic Advisor',
    phone: '9876500004',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
  },
  {
    id: 'fac-5',
    name: 'Prof. John Backus',
    email: 'john.backus@mitc.edu',
    designation: 'Associate Professor & Lab In-Charge',
    phone: '9876500005',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  },
];

export const INITIAL_SECTIONS = [
  // CSE Year 1
  {
    id: 'sec-cse-1-a',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 1,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-1',
    faculty_name: 'Dr. Alan Turing',
    faculty_email: 'alan.turing@mitc.edu',
    faculty_designation: 'Professor & Class Counselor',
    faculty_phone: '9876500001',
  },
  {
    id: 'sec-cse-1-b',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 1,
    name: 'Section B',
    code: 'B',
    faculty_id: 'fac-2',
    faculty_name: 'Dr. Grace Hopper',
    faculty_email: 'grace.hopper@mitc.edu',
    faculty_designation: 'Associate Professor & Section In-Charge',
    faculty_phone: '9876500002',
  },
  // CSE Year 2
  {
    id: 'sec-cse-2-a',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 2,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-2',
    faculty_name: 'Dr. Grace Hopper',
    faculty_email: 'grace.hopper@mitc.edu',
    faculty_designation: 'Associate Professor & Section In-Charge',
    faculty_phone: '9876500002',
  },
  {
    id: 'sec-cse-2-b',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 2,
    name: 'Section B',
    code: 'B',
    faculty_id: 'fac-3',
    faculty_name: 'Prof. Donald Knuth',
    faculty_email: 'donald.knuth@mitc.edu',
    faculty_designation: 'Assistant Professor & Section In-Charge',
    faculty_phone: '9876500003',
  },
  // CSE Year 3
  {
    id: 'sec-cse-3-a',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 3,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-1',
    faculty_name: 'Dr. Alan Turing',
    faculty_email: 'alan.turing@mitc.edu',
    faculty_designation: 'Professor & CSE Head Advisor',
    faculty_phone: '9876500001',
  },
  {
    id: 'sec-cse-3-b',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 3,
    name: 'Section B',
    code: 'B',
    faculty_id: 'fac-4',
    faculty_name: 'Dr. Barbara Liskov',
    faculty_email: 'barbara.liskov@mitc.edu',
    faculty_designation: 'Senior Faculty & Academic Advisor',
    faculty_phone: '9876500004',
  },
  // CSE Year 4
  {
    id: 'sec-cse-4-a',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 4,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-3',
    faculty_name: 'Prof. Donald Knuth',
    faculty_email: 'donald.knuth@mitc.edu',
    faculty_designation: 'Assistant Professor & Section In-Charge',
    faculty_phone: '9876500003',
  },
  {
    id: 'sec-cse-4-b',
    college_id: 'mitc',
    department_id: 'dept-cse',
    year: 4,
    name: 'Section B',
    code: 'B',
    faculty_id: 'fac-5',
    faculty_name: 'Prof. John Backus',
    faculty_email: 'john.backus@mitc.edu',
    faculty_designation: 'Associate Professor & Lab In-Charge',
    faculty_phone: '9876500005',
  },
  // ECE Year 2 & 3
  {
    id: 'sec-ece-2-a',
    college_id: 'mitc',
    department_id: 'dept-ece',
    year: 2,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-4',
    faculty_name: 'Dr. Barbara Liskov',
    faculty_email: 'barbara.liskov@mitc.edu',
    faculty_designation: 'Senior Faculty & ECE Counselor',
    faculty_phone: '9876500004',
  },
  {
    id: 'sec-ece-3-a',
    college_id: 'mitc',
    department_id: 'dept-ece',
    year: 3,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-2',
    faculty_name: 'Dr. Grace Hopper',
    faculty_email: 'grace.hopper@mitc.edu',
    faculty_designation: 'Associate Professor & Section In-Charge',
    faculty_phone: '9876500002',
  },
  // IT Year 2
  {
    id: 'sec-it-2-a',
    college_id: 'mitc',
    department_id: 'dept-it',
    year: 2,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-1',
    faculty_name: 'Dr. Alan Turing',
    faculty_email: 'alan.turing@mitc.edu',
    faculty_designation: 'Professor & IT Counselor',
    faculty_phone: '9876500001',
  },
  // MECH Year 4
  {
    id: 'sec-mech-4-a',
    college_id: 'mitc',
    department_id: 'dept-mech',
    year: 4,
    name: 'Section A',
    code: 'A',
    faculty_id: 'fac-5',
    faculty_name: 'Prof. John Backus',
    faculty_email: 'john.backus@mitc.edu',
    faculty_designation: 'Associate Professor & Project Lead',
    faculty_phone: '9876500005',
  },
];

const SECTIONS_STORAGE_KEY = 'cardcraft_sections_data';
const FACULTY_STORAGE_KEY = 'cardcraft_faculty_data';

export function getStoredSections() {
  try {
    const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse stored sections:', err);
  }
  return INITIAL_SECTIONS;
}

export function saveStoredSections(sections) {
  try {
    localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(sections));
  } catch (err) {
    console.error('Failed to save sections to localStorage:', err);
  }
}

export function getStoredFaculty() {
  try {
    const raw = localStorage.getItem(FACULTY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to parse stored faculty:', err);
  }
  return DEFAULT_FACULTY_ADVISORS;
}

export function saveStoredFaculty(facultyList) {
  try {
    localStorage.setItem(FACULTY_STORAGE_KEY, JSON.stringify(facultyList));
  } catch (err) {
    console.error('Failed to save faculty to localStorage:', err);
  }
}

/**
 * Finds the assigned faculty advisor for a given student based on department, year, and section code.
 */
export function getFacultyAdvisorForSection(sections, deptId, year, sectionCode) {
  if (!sections || !deptId) return null;
  const match = sections.find(
    (s) =>
      s.department_id === deptId &&
      Number(s.year) === Number(year) &&
      s.code?.toUpperCase() === String(sectionCode || 'A').toUpperCase()
  );

  if (match) {
    return {
      id: match.faculty_id,
      name: match.faculty_name,
      email: match.faculty_email,
      designation: match.faculty_designation,
      phone: match.faculty_phone,
    };
  }

  // Fallback to department counselor or first default
  return DEFAULT_FACULTY_ADVISORS[0];
}
