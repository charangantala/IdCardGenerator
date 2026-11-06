import Papa from 'papaparse';
import { BLOOD_GROUPS } from './constants';
import { validateStudentField } from './validators';

/**
 * Expected CSV Headers:
 * name, roll_no, department, year, blood_group, phone, email, dob, gender
 */
export const SAMPLE_CSV_ROWS = [
  {
    name: 'Ethan Hunt',
    roll_no: 'MITC-2024-CS-099',
    department: 'Computer Science & Engineering',
    year: '1',
    section: 'A',
    blood_group: 'O+',
    phone: '9876543220',
    email: 'ethan.hunt@student.mitc.edu',
    dob: '2005-04-12',
    gender: 'Male',
  },
  {
    name: 'Natasha Romanoff',
    roll_no: 'MITC-2023-CS-055',
    department: 'Computer Science & Engineering',
    year: '2',
    section: 'B',
    blood_group: 'A+',
    phone: '9876543221',
    email: 'natasha.r@student.mitc.edu',
    dob: '2004-11-20',
    gender: 'Female',
  },
];

/**
 * Generates and downloads a sample CSV template for bulk student import.
 */
export function downloadSampleCsvTemplate() {
  const csvString = Papa.unparse(SAMPLE_CSV_ROWS);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'student_import_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports student list to a CSV file.
 */
export function exportStudentsToCsv(students = [], filename = 'students_export.csv') {
  if (!students.length) return;

  const dataToExport = students.map((s) => ({
    Name: s.name,
    Roll_No: s.rollNo || s.roll_no,
    Department: s.department || s.department_name,
    Year: s.year,
    Section: s.section || 'A',
    Status: s.status,
    Approved_By: s.approved_by || '',
    Blood_Group: s.bloodGroup || s.blood_group || '',
    Phone: s.phone || '',
    Email: s.email || '',
    DOB: s.dob || '',
    Gender: s.gender || '',
    Valid_Until: s.validUntil || s.valid_until || '',
    Card_ID: s.card_id || '',
  }));

  const csv = Papa.unparse(dataToExport);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a CSV file and validates every row with detailed row-level error reporting.
 * @param {File} file - Uploaded CSV file
 * @param {Array<string>} existingRollNumbers - Roll numbers already in the database
 * @returns {Promise<{ validStudents: Array, rowErrors: Array }>}
 */
export function parseAndValidateStudentCsv(file, existingRollNumbers = []) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        const validStudents = [];
        const rowErrors = [];
        const seenFileRolls = new Set();
        const existingSet = new Set(existingRollNumbers.map((r) => String(r).trim().toLowerCase()));

        rows.forEach((row, index) => {
          const rowNumber = index + 2; // +1 for 0-index, +1 for header
          const errors = [];

          // Normalize keys
          const name = (row.name || row.Name || '').trim();
          const rollNo = (row.roll_no || row.rollNo || row.Roll_No || '').trim();
          const department = (row.department || row.Department || '').trim();
          const year = Number(row.year || row.Year || 1);
          const section = (row.section || row.Section || 'A').trim().toUpperCase().charAt(0) || 'A';
          const bloodGroup = (row.blood_group || row.bloodGroup || row.Blood_Group || 'O+').trim().toUpperCase();
          const phone = (row.phone || row.Phone || '').trim();
          const email = (row.email || row.Email || '').trim();
          const dob = (row.dob || row.DOB || '').trim();
          const gender = (row.gender || row.Gender || 'Male').trim();

          // 1. Name validation
          if (!name) {
            errors.push('Full Name is required');
          } else if (name.length < 2 || name.length > 60) {
            errors.push('Name must be between 2 and 60 characters');
          }

          // 2. Roll number validation (Required, unique in college & file)
          if (!rollNo) {
            errors.push('Roll Number is required');
          } else {
            const lowerRoll = rollNo.toLowerCase();
            if (seenFileRolls.has(lowerRoll)) {
              errors.push(`Duplicate roll number "${rollNo}" found in CSV`);
            } else if (existingSet.has(lowerRoll)) {
              errors.push(`Roll number "${rollNo}" already exists in this college`);
            }
            seenFileRolls.add(lowerRoll);
          }

          // 3. Year validation
          if (!year || year < 1 || year > 6) {
            errors.push('Year must be between 1 and 6');
          }

          // 4. Blood Group validation
          if (bloodGroup && !BLOOD_GROUPS.includes(bloodGroup)) {
            errors.push(`Invalid blood group "${bloodGroup}"`);
          }

          // 5. Phone validation
          if (phone && !/^\d{10}$/.test(phone)) {
            errors.push('Phone must be exactly 10 digits');
          }

          // 6. Email validation
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Invalid email address format');
          }

          // 7. DOB validation
          if (dob) {
            const d = new Date(dob);
            if (isNaN(d.getTime()) || d > new Date()) {
              errors.push('DOB cannot be in the future');
            }
          }

          if (errors.length > 0) {
            rowErrors.push({
              rowNumber,
              rollNo: rollNo || 'N/A',
              name: name || 'N/A',
              messages: errors,
            });
          } else {
            validStudents.push({
              name,
              rollNo,
              roll_no: rollNo,
              department,
              year,
              section,
              bloodGroup,
              blood_group: bloodGroup,
              phone,
              email,
              dob,
              gender,
              status: 'draft',
              card_id: `card-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            });
          }
        });

        resolve({ validStudents, rowErrors });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}
