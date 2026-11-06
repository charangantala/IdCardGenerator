import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import TemplateEditorForm from '../../components/forms/TemplateEditorForm';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import StudentTable from '../../components/tables/StudentTable';
import DepartmentCards from '../../components/filters/DepartmentCards';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import { SAMPLE_TEMPLATES, SAMPLE_DEPARTMENTS } from '../../utils/sampleData';
import { useAuth } from '../../context/AuthContext';
import { templateService } from '../../services/templateService';
import { studentService } from '../../services/studentService';

const COLLEGES_DATA = {
  mitc: {
    id: 'mitc',
    name: 'MIT College of Technology',
    code: 'MITC',
    status: 'active',
    studentLimit: 1200,
    validUntil: '2026-12-31',
    template_config: { ...SAMPLE_TEMPLATES.classicBlue, collegeName: 'MIT College of Technology', collegeCode: 'MITC' },
  },
  ait: {
    id: 'ait',
    name: 'Apex Institute of Technology',
    code: 'AIT',
    status: 'active',
    studentLimit: 850,
    validUntil: '2027-06-30',
    template_config: { ...SAMPLE_TEMPLATES.modernEmerald, collegeName: 'Apex Institute of Technology', collegeCode: 'AIT' },
  },
  sec: {
    id: 'sec',
    name: 'Stanford Engineering College',
    code: 'SEC',
    status: 'active',
    studentLimit: 2000,
    validUntil: '2026-08-31',
    template_config: { ...SAMPLE_TEMPLATES.crimsonTech, collegeName: 'Stanford Engineering College', collegeCode: 'SEC' },
  },
};

export default function CollegeDetails() {
  const { id = 'mitc' } = useParams();
  const navigate = useNavigate();
  const { setViewAs } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // overview, template, departments, students
  const college = COLLEGES_DATA[id] || {
    id,
    name: id.toUpperCase(),
    code: id.toUpperCase(),
    status: 'active',
    studentLimit: 1000,
    validUntil: '2027-12-31',
    template_config: SAMPLE_TEMPLATES.classicBlue,
  };

  // College-specific template state
  const [template, setTemplate] = useState(college.template_config);
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);
  const [cardModal, setCardModal] = useState({ isOpen: false, student: null });
  const [toast, setToast] = useState(null);

  // Load persisted template on mount
  useEffect(() => {
    async function loadTemplate() {
      try {
        const loaded = await templateService.getTemplateByCollegeId(id);
        if (loaded) {
          setTemplate({
            ...loaded,
            collegeName: loaded.collegeName || college.name,
            collegeCode: loaded.collegeCode || college.code,
          });
        }
      } catch (e) {
        console.error('Failed to load template:', e);
      }
    }
    loadTemplate();
  }, [id]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter students belonging to this college
  const collegeStudents = useMemo(() => {
    return SAMPLE_STUDENTS.filter((s) => (s.college_id || 'mitc') === id);
  }, [id]);

  // Filter departments belonging to this college
  const collegeDepartments = useMemo(() => {
    return SAMPLE_DEPARTMENTS.filter((d) => (d.college_id || 'mitc') === id);
  }, [id]);

  const [liveStudents, setLiveStudents] = useState([]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const list = await studentService.getStudentsByCollege(id);
        if (list && list.length > 0) setLiveStudents(list);
      } catch (e) {
        console.warn('Could not load students for preview:', e);
      }
    }
    fetchStudents();
  }, [id]);

  const activeStudent = liveStudents[previewStudentIndex] || {
    name: 'Sample Student Preview',
    rollNo: `${college.code || 'COL'}-2024-001`,
    department: 'Computer Science & Engineering',
    year: 2,
    section: 'A',
    bloodGroup: 'O+',
    phone: '9876543210',
    email: `student@${(college.code || 'mitc').toLowerCase()}.edu`,
    status: 'approved',
    collegeName: template.collegeName || college.name,
    collegeCode: template.collegeCode || college.code,
  };

  const handleSaveTemplate = async () => {
    try {
      await templateService.updateTemplate(id, template);
      showToast(`Template design & logo saved for ${college.name}!`, 'success');
    } catch (e) {
      showToast('Template saved locally.', 'info');
    }
  };

  const handleViewAsCollege = () => {
    setViewAs('college');
    navigate('/college');
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumbs & Header */}
      <div className="border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-blue-600 transition-colors">
              Colleges
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-bold uppercase">{college.code}</span>
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {college.name}
            </h1>
            <Badge variant={college.status === 'active' ? 'green' : 'red'}>
              {college.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            College Code: <span className="font-mono font-bold text-gray-700">{college.code}</span> • Valid until {college.validUntil}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleViewAsCollege}
          >
            View As This College 👁️
          </Button>
          <Link
            to={`/admin/colleges/${id}/template`}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs"
          >
            Open Full Template Editor 🎨
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-4">
        {[
          { key: 'overview', label: 'Overview & Metrics' },
          { key: 'template', label: 'Card Template 🎨' },
          { key: 'departments', label: `Departments (${collegeDepartments.length})` },
          { key: 'students', label: `Students (${collegeStudents.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-700 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                Enrolled Students
              </span>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {collegeStudents.length}
              </div>
              <span className="text-xs text-blue-600 font-medium">
                of {college.studentLimit} capacity limit
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                Cards Approved
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {collegeStudents.filter((s) => s.status === 'approved').length}
              </div>
              <span className="text-xs text-gray-400">Download-ready</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                Pending Verification
              </span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {collegeStudents.filter((s) => s.status === 'submitted').length}
              </div>
              <span className="text-xs text-gray-400">Awaiting college review</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                Departments
              </span>
              <div className="text-2xl font-extrabold text-indigo-600 mt-1">
                {collegeDepartments.length}
              </div>
              <span className="text-xs text-gray-400">Active degree programs</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">License Capacity Usage</h3>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    Math.round((collegeStudents.length / college.studentLimit) * 100),
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>Used: {collegeStudents.length} cards</span>
              <span>Total License: {college.studentLimit} cards</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE (Template Editor with live preview per Section 8.2) */}
      {activeTab === 'template' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
            <div className="mb-4 pb-2 border-b">
              <h2 className="text-base font-bold text-gray-900">
                Custom Card Template for {college.name}
              </h2>
              <p className="text-xs text-gray-500">
                All changes directly apply to this college's issued student ID cards.
              </p>
            </div>
            <TemplateEditorForm
              template={template}
              onChange={setTemplate}
              onSave={handleSaveTemplate}
            />
          </div>

          <div className="lg:col-span-5 sticky top-20">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Live Preview:
                </span>
                <div className="flex space-x-1">
                  {SAMPLE_STUDENTS.slice(0, 3).map((st, i) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setPreviewStudentIndex(i)}
                      className={`px-2 py-0.5 text-xs rounded font-medium ${
                        previewStudentIndex === i
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {st.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <IdCardPreview
                student={activeStudent}
                template={template}
                status="approved"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <DepartmentCards
            departments={collegeDepartments}
            selectedId={collegeDepartments[0]?.id}
          />
        </div>
      )}

      {/* TAB 4: STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2">
            <h3 className="text-base font-bold text-gray-900">
              Students Enrolled at {college.name}
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              Total: {collegeStudents.length}
            </span>
          </div>

          <StudentTable
            students={collegeStudents}
            onViewCard={(student) => setCardModal({ isOpen: true, student })}
          />
        </div>
      )}

      {/* Preview Card Modal */}
      <Modal
        isOpen={cardModal.isOpen}
        onClose={() => setCardModal({ isOpen: false, student: null })}
        title={`ID Card: ${cardModal.student?.name || ''}`}
        maxWidth="max-w-md"
      >
        {cardModal.student && (
          <div className="space-y-4">
            <IdCardPreview
              student={cardModal.student}
              template={template}
              status={cardModal.student.status}
            />
            <div className="flex justify-end pt-3 border-t">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCardModal({ isOpen: false, student: null })}
              >
                Close
              </Button>
            </div>
          </div>
        )}
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
