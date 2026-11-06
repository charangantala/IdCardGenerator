import { useState } from 'react';

export function useTemplate(collegeId) {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  return { template, loading, error, setTemplate };
}

