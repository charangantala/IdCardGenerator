import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import CollegeHome from './CollegeHome';

export default function DepartmentStudents() {
  // Routes to the main interactive CollegeHome with department pre-selected
  return <CollegeHome />;
}
