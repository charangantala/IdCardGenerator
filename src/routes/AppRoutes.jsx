import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Verify from '../pages/Verify';
import CardsTest from '../pages/CardsTest';
import AdminHome from '../pages/admin/AdminHome';
import CollegeDetails from '../pages/admin/CollegeDetails';
import TemplateEditor from '../pages/admin/TemplateEditor';
import CollegeHome from '../pages/college/CollegeHome';
import DepartmentStudents from '../pages/college/DepartmentStudents';
import StudentEdit from '../pages/college/StudentEdit';
import StudentHome from '../pages/student/StudentHome';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/verify/:cardId" element={<Verify />} />
      <Route path="/cards-test" element={<CardsTest />} />

      {/* Admin routes (Admin only) */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/colleges/:id" element={<CollegeDetails />} />
        <Route path="/admin/colleges/:id/template" element={<TemplateEditor />} />
      </Route>

      {/* College routes (College only, or Admin in View As mode) */}
      <Route element={<ProtectedRoute allowedRoles={['college', 'admin']} />}>
        <Route path="/college" element={<CollegeHome />} />
        <Route path="/college/departments/:deptId" element={<DepartmentStudents />} />
        <Route path="/college/students/:studentId" element={<StudentEdit />} />
      </Route>

      {/* Student routes (Student, College, or Admin) */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'college', 'admin']} />}>
        <Route path="/student" element={<StudentHome />} />
      </Route>

      {/* Fallback & Root redirects to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
