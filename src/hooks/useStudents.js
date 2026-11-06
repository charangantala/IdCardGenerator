import { useState } from 'react';

export function useStudents(collegeId, deptId, year) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return { students, loading, error, setStudents };
}

