export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CARD_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const DEFAULT_TEMPLATE = {
  layout: 'vertical',
  colors: {
    primary: '#1e3a8a',
    secondary: '#f59e0b',
    text: '#111827',
    background: '#ffffff',
  },
  font: 'Poppins',
  logoPosition: 'top-center',
  photoShape: 'circle',
  showFields: ['name', 'rollNo', 'department', 'year', 'bloodGroup', 'phone', 'validUntil'],
  fieldLabels: { rollNo: 'Roll No', bloodGroup: 'Blood Group' },
  showQR: true,
  footerText: 'If found, please return to the college office.',
  cornerRadius: 12,
};

