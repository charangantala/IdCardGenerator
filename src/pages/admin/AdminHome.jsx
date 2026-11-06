import React, { useState, useMemo } from 'react';
import CollegeTable from '../../components/tables/CollegeTable';
import CollegeForm from '../../components/forms/CollegeForm';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { SAMPLE_STUDENTS, SAMPLE_TEMPLATES } from '../../utils/sampleData';

const INITIAL_COLLEGES = [
  {
    id: 'mitc',
    name: 'MIT College of Technology',
    code: 'MITC',
    status: 'active',
    studentLimit: 1200,
    student_limit: 1200,
    validUntil: '2026-12-31',
    valid_until: '2026-12-31',
    template_config: SAMPLE_TEMPLATES.classicBlue,
  },
  {
    id: 'ait',
    name: 'Apex Institute of Technology',
    code: 'AIT',
    status: 'active',
    studentLimit: 850,
    student_limit: 850,
    validUntil: '2027-06-30',
    valid_until: '2027-06-30',
    template_config: SAMPLE_TEMPLATES.modernEmerald,
  },
  {
    id: 'sec',
    name: 'Stanford Engineering College',
    code: 'SEC',
    status: 'active',
    studentLimit: 2000,
    student_limit: 2000,
    validUntil: '2026-08-31',
    valid_until: '2026-08-31',
    template_config: SAMPLE_TEMPLATES.crimsonTech,
  },
];

export default function AdminHome() {
  const [colleges, setColleges] = useState(INITIAL_COLLEGES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [collegeModal, setCollegeModal] = useState({ isOpen: false, college: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, college: null });
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Compute student counts per college
  const studentCounts = useMemo(() => {
    const counts = {};
    SAMPLE_STUDENTS.forEach((st) => {
      const colId = st.college_id || 'mitc';
      counts[colId] = (counts[colId] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered colleges list
  const filteredColleges = useMemo(() => {
    return colleges.filter((col) => {
      if (statusFilter !== 'all' && col.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = col.name.toLowerCase().includes(query);
        const matchesCode = col.code.toLowerCase().includes(query);
        if (!matchesName && !matchesCode) return false;
      }
      return true;
    });
  }, [colleges, statusFilter, searchTerm]);

  // Handlers
  const handleSaveCollege = (formData) => {
    if (formData.id) {
      // Edit
      setColleges((prev) =>
        prev.map((c) => (c.id === formData.id ? { ...c, ...formData } : c))
      );
      showToast(`College "${formData.name}" updated successfully!`, 'success');
    } else {
      // Add
      const newCollege = {
        ...formData,
        id: formData.code.toLowerCase(),
        template_config: SAMPLE_TEMPLATES.classicBlue,
      };
      setColleges((prev) => [newCollege, ...prev]);
      showToast(`College "${newCollege.name}" created with first registrar login!`, 'success');
    }
    setCollegeModal({ isOpen: false, college: null });
  };

  const handleToggleStatus = (college) => {
    const newStatus = college.status === 'suspended' ? 'active' : 'suspended';
    setColleges((prev) =>
      prev.map((c) => (c.id === college.id ? { ...c, status: newStatus } : c))
    );
    showToast(
      `College "${college.name}" has been ${newStatus === 'active' ? 'activated' : 'suspended'}.`,
      newStatus === 'active' ? 'success' : 'warning'
    );
  };

  const handleDelete = () => {
    if (!deleteConfirm.college) return;
    setColleges((prev) => prev.filter((c) => c.id !== deleteConfirm.college.id));
    showToast(`College "${deleteConfirm.college.name}" was permanently removed.`, 'info');
    setDeleteConfirm({ isOpen: false, college: null });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
            Platform Owner • Admin
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            College Tenant Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Register colleges, configure individual card templates, control subscription statuses, and monitor capacities.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCollegeModal({ isOpen: true, college: null })}
        >
          + Add New College
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
            Total Colleges
          </span>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">{colleges.length}</div>
          <span className="text-xs text-emerald-600 font-medium">All partner institutions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
            Active Accounts
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {colleges.filter((c) => c.status === 'active').length}
          </div>
          <span className="text-xs text-gray-400">Operational SaaS tenants</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
            Suspended
          </span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {colleges.filter((c) => c.status === 'suspended').length}
          </div>
          <span className="text-xs text-gray-400">Blocked from login</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
            Total Student Capacity
          </span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {colleges.reduce((acc, c) => acc + (c.studentLimit || 0), 0).toLocaleString()}
          </div>
          <span className="text-xs text-gray-400">Licensed digital ID cards</span>
        </div>
      </div>

      {/* College Table Section */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        {/* Filters Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
          <h2 className="text-base font-bold text-gray-900">Registered Institutions</h2>

          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by college name or code..."
                className="w-64 text-xs px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>

        {/* Table Component */}
        <CollegeTable
          colleges={filteredColleges}
          onEdit={(col) => setCollegeModal({ isOpen: true, college: col })}
          onToggleStatus={handleToggleStatus}
          onDelete={(col) => setDeleteConfirm({ isOpen: true, college: col })}
          onAddNew={() => setCollegeModal({ isOpen: true, college: null })}
          studentCounts={studentCounts}
        />
      </section>

      {/* Modal: Add / Edit College */}
      <Modal
        isOpen={collegeModal.isOpen}
        onClose={() => setCollegeModal({ isOpen: false, college: null })}
        title={collegeModal.college?.id ? 'Edit College Details' : 'Register New College Tenant'}
        maxWidth="max-w-lg"
      >
        <CollegeForm
          initialData={collegeModal.college || {}}
          onSubmit={handleSaveCollege}
          onCancel={() => setCollegeModal({ isOpen: false, college: null })}
        />
      </Modal>

      {/* Modal: Confirm Delete */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, college: null })}
        title="Confirm College Deletion"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center text-xl font-bold">
            🗑️
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Are you sure you want to delete this college tenant?
          </p>
          <p className="text-xs text-gray-500">
            <strong>{deleteConfirm.college?.name}</strong> ({deleteConfirm.college?.code}) and all associated student records will be removed.
          </p>
          <div className="flex justify-center space-x-3 pt-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteConfirm({ isOpen: false, college: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Yes, Delete Tenant
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
