import { BLOOD_GROUPS } from './constants';

/**
 * Validates a single student field or entire student data object according to Section 9.
 */
export function validateStudentField(name, value, allData = {}) {
  switch (name) {
    case 'name':
      if (!value || !value.trim()) return 'Full name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      if (value.trim().length > 60) return 'Name must not exceed 60 characters';
      return '';

    case 'rollNo':
    case 'roll_no':
      if (!value || !String(value).trim()) return 'Roll number is required';
      return '';

    case 'phone':
      if (value && !/^\d{10}$/.test(String(value).trim())) {
        return 'Phone number must be exactly 10 digits';
      }
      return '';

    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())) {
        return 'Please enter a valid email address';
      }
      return '';

    case 'dob':
      if (value) {
        const dobDate = new Date(value);
        const today = new Date();
        if (isNaN(dobDate.getTime())) return 'Invalid date format';
        if (dobDate > today) return 'Date of birth cannot be in the future';
      }
      return '';

    case 'bloodGroup':
    case 'blood_group':
      if (value && !BLOOD_GROUPS.includes(value)) {
        return 'Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-';
      }
      return '';

    case 'year':
      const yr = Number(value);
      const maxYears = allData.maxYears || 4;
      if (!yr || yr < 1 || yr > maxYears) {
        return `Year must be between 1 and ${maxYears}`;
      }
      return '';

    case 'photoUrl':
    case 'photo_url':
      // Photo is recommended but not strictly blocking draft save
      return '';

    default:
      return '';
  }
}

/**
 * Validates the full student form.
 */
export function validateStudent(data = {}) {
  const errors = {};
  const fieldsToValidate = ['name', 'rollNo', 'phone', 'email', 'dob', 'bloodGroup', 'year'];

  fieldsToValidate.forEach((field) => {
    const error = validateStudentField(field, data[field], data);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
