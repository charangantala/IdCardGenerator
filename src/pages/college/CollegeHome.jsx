import React, { useState, useMemo, useRef } from 'react';
import DepartmentCards from '../../components/filters/DepartmentCards';
import YearTabs from '../../components/filters/YearTabs';
import StudentTable from '../../components/tables/StudentTable';
import StudentForm from '../../components/forms/StudentForm';
import DepartmentForm from '../../components/forms/DepartmentForm';
import CsvImportModal from '../../components/forms/CsvImportModal';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import IdCard from '../../components/IdCard/IdCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { SAMPLE_DEPARTMENTS, SAMPLE_STUDENTS, SAMPLE_TEMPLATES } from '../../utils/sampleData';
import { exportStudentsToCsv } from '../../utils/csv';
import { downloadBatchCardsAsPdf } from '../../utils/downloadCard';
import { useAuth } from '../../context/AuthContext';

export default function CollegeHome() {
  const { user } = useAuth();
  const collegeName = user?.collegeName || 'MIT College of Technology';

  // State
  const [departments, setDepartments] = useState([...SAMPLE_DEPARTMENTS]);
  const [students, setStudents] = useState([...SAMPLE_STUDENTS]);
  const [selectedDeptId, setSelectedDeptId] = useState(SAMPLE_DEPARTMENTS[0]?.id || 'dept-cse');
  const [selectedYear, setSelectedYear] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [studentModal, setStudentModal] = useState({ isOpen: false, student: null });
  const [cardPreviewModal, setCardPreviewModal] = useState({ isOpen: false, student: null });
  const [departmentModal, setDepartmentModal] = useState({ isOpen: false, department: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, student: null, reason: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, type: '', item: null });
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  // Batch PDF generation state
  const [batchPdfLoading, setBatchPdfLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const batchRenderRef = useRef(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Active department
  const activeDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedDeptId) || departments[0];
  }, [departments, selectedDeptId]);

  // Existing roll numbers for duplicate detection during CSV import
  const existingRollNumbers = useMemo(() => {
    return students.map((s) => s.rollNo || s.roll_no);
  }, [students]);

  // Student counts per department
  const studentCounts = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      counts[s.department_id] = (counts[s.department_id] || 0) + 1;
    });
    return counts;
  }, [students]);

  // Student counts by year
  const studentCountsByYear = useMemo(() => {
    const counts = {};
    students
      .filter((s) => s.department_id === selectedDeptId)
      .forEach((s) => {
        counts[s.year] = (counts[s.year] || 0) + 1;
      });
    return counts;
  }, [students, selectedDeptId]);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.department_id !== selectedDeptId) return false;
      if (selectedYear !== 'all' && Number(s.year) !== Number(selectedYear)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = s.name?.toLowerCase().includes(query);
        const matchesRoll = (s.rollNo || s.roll_no)?.toLowerCase().includes(query);
        if (!matchesName && !matchesRoll) return false;
      }
      return true;
    });
  }, [students, selectedDeptId, selectedYear, statusFilter, searchTerm]);

  // Approved students eligible for batch PDF
  const approvedStudents = useMemo(() => {
    return filteredStudents.filter((s) => s.status === 'approved');
  }, [filteredStudents]);

  // -------------------------------------------------------------
  // Bulk CSV Handlers
  // -------------------------------------------------------------
  const handleBulkImportComplete = (importedStudents) => {
    setStudents((prev) => [...importedStudents, ...prev]);
    showToast(`Successfully imported ${importedStudents.length} students!`, 'success');
  };

  const handleExportCsv = () => {
    exportStudentsToCsv(
      filteredStudents,
      `${activeDepartment?.code || 'dept'}_students_${selectedYear}_year.csv`
    );
    showToast(`Exported ${filteredStudents.length} students to CSV!`, 'info');
  };

  // -------------------------------------------------------------
  // Batch PDF Export Handler
  // -------------------------------------------------------------
  const handleBatchPdfExport = async () => {
    if (!approvedStudents.length) {
      showToast('No approved student cards found in this view to export.', 'warning');
      return;
    }

    try {
      setBatchPdfLoading(true);
      setBatchProgress({ current: 0, total: approvedStudents.length });

      // Grab all rendered card elements from the hidden batch container
      const cardNodes = batchRenderRef.current?.querySelectorAll('.id-card-container');
      if (!cardNodes || !cardNodes.length) {
        throw new Error('Could not find rendered card nodes for PDF generation');
      }

      await downloadBatchCardsAsPdf(
        Array.from(cardNodes),
        `${activeDepartment?.code}_approved_batch_cards.pdf`,
        'vertical',
        (curr, tot) => setBatchProgress({ current: curr, total: tot })
      );

      showToast(`Batch PDF generated with ${approvedStudents.length} approved cards!`, 'success');
    } catch (err) {
      console.error('Batch PDF failed:', err);
      showToast('Failed to generate batch PDF. Please try again.', 'error');
    } finally {
      setBatchPdfLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Department & Student CRUD Handlers
  // -------------------------------------------------------------
  const handleSaveDepartment = (deptData) => {
    if (deptData.id) {
      setDepartments((prev) =>
        prev.map((d) => (d.id === deptData.id ? { ...d, ...deptData } : d))
      );
      showToast(`Department "${deptData.name}" updated!`, 'success');
    } else {
      const newDept = {
        ...deptData,
        id: `dept-${Date.now()}`,
        college_id: user?.college_id || 'mitc',
      };
      setDepartments((prev) => [...prev, newDept]);
      setSelectedDeptId(newDept.id);
      showToast(`Department "${newDept.name}" created!`, 'success');
    }
    setDepartmentModal({ isOpen: false, department: null });
  };

  const handleDeleteDepartment = (dept) => {
    setDeleteConfirm({ isOpen: true, type: 'department', item: dept });
  };

  const handleOpenAddStudent = () => {
    setStudentModal({
      isOpen: true,
      student: {
        name: '',
        rollNo: '',
        department_id: selectedDeptId,
        department: activeDepartment?.name || '',
        year: selectedYear === 'all' ? 1 : Number(selectedYear),
        status: 'draft',
        gender: 'Male',
        bloodGroup: 'O+',
        phone: '',
        email: '',
        photoUrl: '',
        collegeName,
      },
    });
  };

  const handleSaveStudent = (field, val) => {
    setStudentModal((prev) => ({
      ...prev,
      student: { ...prev.student, [field]: val },
    }));
  };

  const handleStudentFormSubmit = () => {
    const s = studentModal.student;
    if (!s.name?.trim() || !s.rollNo?.trim()) {
      showToast('Please provide both student name and roll number.', 'error');
      return;
    }

    if (s.id) {
      setStudents((prev) => prev.map((item) => (item.id === s.id ? { ...item, ...s } : item)));
      showToast(`Student "${s.name}" updated!`, 'success');
    } else {
      const newStudent = {
        ...s,
        id: `stud-${Date.now()}`,
        college_id: user?.college_id || 'mitc',
        card_id: `card-${Date.now()}`,
        validUntil: '2027-06-30',
        collegeName,
      };
      setStudents((prev) => [newStudent, ...prev]);
      showToast(`Student "${newStudent.name}" enrolled!`, 'success');
    }
    setStudentModal({ isOpen: false, student: null });
  };

  const handleDeleteStudent = (student) => {
    setDeleteConfirm({ isOpen: true, type: 'student', item: student });
  };

  const confirmDelete = () => {
    if (deleteConfirm.type === 'student') {
      setStudents((prev) => prev.filter((s) => s.id !== deleteConfirm.item.id));
      showToast('Student record deleted.', 'info');
    } else if (deleteConfirm.type === 'department') {
      setDepartments((prev) => prev.filter((d) => d.id !== deleteConfirm.item.id));
      const remaining = departments.filter((d) => d.id !== deleteConfirm.item.id);
      if (remaining.length > 0) setSelectedDeptId(remaining[0].id);
      showToast('Department removed.', 'info');
    }
    setDeleteConfirm({ isOpen: false, type: '', item: null });
  };

  const handleApproveStudent = (student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, status: 'approved', reject_reason: null } : s))
    );
    showToast(`Approved card for ${student.name}!`, 'success');
  };

  const handleOpenRejectModal = (student) => {
    setRejectModal({
      isOpen: true,
      student,
      reason: 'Photo is blurry or does not meet passport standard; please re-upload.',
    });
  };

  const handleConfirmReject = () => {
    if (!rejectModal.reason.trim()) {
      showToast('Please specify a rejection reason.', 'error');
      return;
    }
    setStudents((prev) =>
      prev.map((s) =>
        s.id === rejectModal.student.id
          ? { ...s, status: 'rejected', reject_reason: rejectModal.reason.trim() }
          : s
      )
    );
    showToast(`Rejected card application for ${rejectModal.student.name}.`, 'info');
    setRejectModal({ isOpen: false, student: null, reason: '' });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Bulk Action Buttons */}
      <div className="border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
            College Administration
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            {collegeName}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage degree programs, bulk import/export student cohorts, and verify ID cards.
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setCsvModalOpen(true)}
            title="Import students from CSV"
          >
            Import CSV 📥
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            disabled={!filteredStudents.length}
            title="Export filtered student list to CSV"
          >
            Export CSV 📤
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleBatchPdfExport}
            disabled={!approvedStudents.length || batchPdfLoading}
            title="Download all approved cards in this view as one multi-page PDF"
          >
            {batchPdfLoading
              ? `Exporting (${batchProgress.current}/${batchProgress.total})...`
              : `Batch PDF (${approvedStudents.length}) 📄`}
          </Button>

          <Button variant="primary" size="sm" onClick={handleOpenAddStudent}>
            + Add Student
          </Button>
        </div>
      </div>

      {/* 1. Departments Grid */}
      <section>
        <DepartmentCards
          departments={departments}
          selectedId={selectedDeptId}
          onSelect={(id) => {
            setSelectedDeptId(id);
            setSelectedYear('all');
          }}
          onAddNew={() => setDepartmentModal({ isOpen: true, department: null })}
          onEdit={(dept) => setDepartmentModal({ isOpen: true, department: dept })}
          onDelete={handleDeleteDepartment}
          studentCounts={studentCounts}
        />
      </section>

      {/* 2. Department Details, Year Tabs, & Student Table */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {activeDepartment?.code}
              </span>
              <h2 className="text-xl font-bold text-gray-900">
                {activeDepartment?.name}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {activeDepartment?.description || 'Manage student cohorts and approve cards.'}
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or roll no..."
                className="w-56 text-xs px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">🔍</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted (Under Review)</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Year Filter Tabs */}
        <YearTabs
          yearsCount={activeDepartment?.years || 4}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          studentCountsByYear={studentCountsByYear}
        />

        {/* Student Table */}
        <StudentTable
          students={filteredStudents}
          onViewCard={(student) => setCardPreviewModal({ isOpen: true, student })}
          onEdit={(student) => setStudentModal({ isOpen: true, student })}
          onDelete={handleDeleteStudent}
          onApprove={handleApproveStudent}
          onReject={handleOpenRejectModal}
          onAddNew={handleOpenAddStudent}
        />
      </section>

      {/* Hidden Offscreen Container for Batch Multi-Page PDF Generation */}
      <div
        ref={batchRenderRef}
        className="fixed left-[-9999px] top-[-9999px] pointer-events-none opacity-0"
        aria-hidden="true"
      >
        {approvedStudents.map((st) => (
          <div key={`batch-${st.id}`} className="p-4">
            <IdCard
              student={st}
              template={{ ...SAMPLE_TEMPLATES.classicBlue, collegeName }}
            />
          </div>
        ))}
      </div>

      {/* Modal: CSV Bulk Import */}
      <CsvImportModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        onImportComplete={handleBulkImportComplete}
        existingRollNumbers={existingRollNumbers}
        activeDepartment={activeDepartment}
      />

      {/* Modal: Add / Edit Student */}
      <Modal
        isOpen={studentModal.isOpen}
        onClose={() => setStudentModal({ isOpen: false, student: null })}
        title={studentModal.student?.id ? 'Edit Student Record' : 'Enroll New Student'}
        maxWidth="max-w-2xl"
      >
        {studentModal.student && (
          <div className="space-y-4">
            <StudentForm
              formData={studentModal.student}
              onChange={handleSaveStudent}
              showActions={false}
            />
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStudentModal({ isOpen: false, student: null })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStudentFormSubmit}
              >
                Save Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Card Preview */}
      <Modal
        isOpen={cardPreviewModal.isOpen}
        onClose={() => setCardPreviewModal({ isOpen: false, student: null })}
        title={`ID Card: ${cardPreviewModal.student?.name || ''}`}
        maxWidth="max-w-md"
      >
        {cardPreviewModal.student && (
          <div className="space-y-4">
            <IdCardPreview
              student={cardPreviewModal.student}
              template={SAMPLE_TEMPLATES.classicBlue}
              status={cardPreviewModal.student.status}
            />
            <div className="flex justify-end pt-3 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCardPreviewModal({ isOpen: false, student: null })}
              >
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Department Create/Edit */}
      <Modal
        isOpen={departmentModal.isOpen}
        onClose={() => setDepartmentModal({ isOpen: false, department: null })}
        title={departmentModal.department?.id ? 'Edit Department' : 'Create New Department'}
        maxWidth="max-w-md"
      >
        <DepartmentForm
          initialData={departmentModal.department || {}}
          onSubmit={handleSaveDepartment}
          onCancel={() => setDepartmentModal({ isOpen: false, department: null })}
        />
      </Modal>

      {/* Modal: Reject Reason */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, student: null, reason: '' })}
        title="Reject Card Application"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Provide a reason for rejecting the card for{' '}
            <strong>{rejectModal.student?.name}</strong>.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. Photo does not meet passport standard."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setRejectModal({ isOpen: false, student: null, reason: '' })}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Delete Confirm */}
      <Modal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, type: '', item: null })}
        title="Confirm Deletion"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center text-xl font-bold">
            🗑️
          </div>
          <p className="text-sm font-semibold text-gray-800">
            Delete this {deleteConfirm.type}?
          </p>
          <p className="text-xs text-gray-500">
            {deleteConfirm.item?.name}
          </p>
          <div className="flex justify-center space-x-3 pt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeleteConfirm({ isOpen: false, type: '', item: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
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
