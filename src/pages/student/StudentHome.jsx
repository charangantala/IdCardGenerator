import React, { useState, useEffect } from 'react';
import StudentForm from '../../components/forms/StudentForm';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import Toast from '../../components/common/Toast';
import { SAMPLE_STUDENTS, SAMPLE_TEMPLATES } from '../../utils/sampleData';
import { validateStudent, validateStudentField } from '../../utils/validators';
import { templateService } from '../../services/templateService';
import { useAuth } from '../../context/AuthContext';

const COLLEGE_OPTIONS = [
  { id: 'mitc', name: 'MIT College of Technology', code: 'MITC' },
  { id: 'ait', name: 'Apex Institute of Technology', code: 'AIT' },
  { id: 'sec', name: 'Stanford Engineering College', code: 'SEC' },
];

export default function StudentHome() {
  const { user } = useAuth();
  const initialCollegeId = (user?.college_id || 'mitc').toLowerCase();

  const [activeCollegeId, setActiveCollegeId] = useState(initialCollegeId);
  const activeCollege =
    COLLEGE_OPTIONS.find((c) => c.id === activeCollegeId) || COLLEGE_OPTIONS[0];

  const [studentData, setStudentData] = useState({
    ...SAMPLE_STUDENTS[0],
    college_id: activeCollege.id,
    collegeName: activeCollege.name,
    collegeCode: activeCollege.code,
    status: 'draft',
  });

  const [template, setTemplate] = useState({ ...SAMPLE_TEMPLATES.classicBlue });
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [errors, setErrors] = useState({});
  const [rejectReason, setRejectReason] = useState(
    'Please upload a clear passport photo with a plain white background.'
  );
  const [toast, setToast] = useState(null);

  // Load the college's assigned template from templateService
  useEffect(() => {
    async function loadAssignedTemplate() {
      setLoadingTemplate(true);
      try {
        const assignedTemplate = await templateService.getTemplateByCollegeId(activeCollegeId);
        setTemplate({
          ...assignedTemplate,
          collegeName: activeCollege.name,
          collegeCode: activeCollege.code,
        });

        // Also update student data's college branding
        setStudentData((prev) => ({
          ...prev,
          college_id: activeCollege.id,
          collegeName: activeCollege.name,
          collegeCode: activeCollege.code,
          collegeLogo: assignedTemplate.collegeLogo,
        }));
      } catch (err) {
        console.error('Failed to load assigned template for college:', err);
      } finally {
        setLoadingTemplate(false);
      }
    }

    loadAssignedTemplate();
  }, [activeCollegeId, activeCollege.name, activeCollege.code]);

  // Real-time update on every keystroke
  const handleFieldChange = (name, value) => {
    setStudentData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'rollNo') updated.roll_no = value;
      if (name === 'department') updated.department_name = value;
      if (name === 'bloodGroup') updated.blood_group = value;
      return updated;
    });

    const fieldError = validateStudentField(name, value, studentData);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSaveDraft = () => {
    setStudentData((prev) => ({ ...prev, status: 'draft' }));
    showToast('Draft saved successfully! You can continue editing anytime.', 'info');
  };

  const handleSubmitForApproval = () => {
    const { isValid, errors: validationErrors } = validateStudent(studentData);
    if (!isValid) {
      setErrors(validationErrors);
      showToast('Please fix the validation errors before submitting.', 'error');
      return;
    }

    setStudentData((prev) => ({ ...prev, status: 'submitted' }));
    showToast('ID card submitted for college administration review!', 'success');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Mock reviewer actions to test all states
  const handleSimulateStatus = (newStatus) => {
    setStudentData((prev) => ({ ...prev, status: newStatus }));
    if (newStatus === 'approved') {
      showToast('College administration has APPROVED your ID card!', 'success');
    } else if (newStatus === 'rejected') {
      showToast('College administration has REJECTED your ID card with reason.', 'error');
    } else if (newStatus === 'draft') {
      showToast('Form reset to Draft status.', 'info');
    } else if (newStatus === 'submitted') {
      showToast('Status set to Submitted.', 'info');
    }
  };

  const isFormLocked = studentData.status === 'submitted' || studentData.status === 'approved';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner & Title */}
      <div className="border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
            Student Portal
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Student ID Card Application
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in your details on the left. The live ID card preview on the right is rendered using your college's official template and logo.
          </p>
        </div>

        {/* Quick Testing Workflow Bar for Reviewers */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Switch College to test per-college templates */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center space-x-2 border border-slate-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase px-1">
              College Template:
            </span>
            <select
              value={activeCollegeId}
              onChange={(e) => setActiveCollegeId(e.target.value)}
              className="text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-gray-300 shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-500"
            >
              {COLLEGE_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} ({c.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          {/* Status Simulator */}
          <div className="bg-slate-100 p-1.5 rounded-xl flex items-center space-x-1.5 border border-slate-200">
            <span className="text-[10px] font-bold text-gray-500 uppercase px-1">
              Status:
            </span>
            {['draft', 'submitted', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleSimulateStatus(st)}
                className={`px-2 py-1 text-xs rounded capitalize font-medium transition-colors ${
                  studentData.status === st
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* College Template Attribution Pill */}
      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center space-x-2">
          {template.collegeLogo ? (
            <img
              src={template.collegeLogo}
              alt="Logo"
              className="w-6 h-6 object-contain bg-blue-900 p-0.5 rounded"
            />
          ) : (
            <span className="font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px]">
              {activeCollege.code}
            </span>
          )}
          <span>
            Active Template: <strong>{activeCollege.name}</strong> • Designed by Platform Admin
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
          {template.layout || 'Vertical'} Layout
        </span>
      </div>

      {/* Dynamic Status Notification Banner */}
      {studentData.status === 'approved' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              ✓
            </span>
            <div>
              <p className="font-bold text-sm">Congratulations! Your ID card has been approved.</p>
              <p className="text-xs text-emerald-700">
                You can now download your digital ID card in high-resolution PNG or printable PDF format on the right.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold uppercase bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full">
            Ready for Download
          </span>
        </div>
      )}

      {studentData.status === 'rejected' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start space-x-3">
          <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
            !
          </span>
          <div>
            <p className="font-bold text-sm">Card Request Rejected by Administration</p>
            <p className="text-xs text-rose-700 mt-0.5">
              <strong>Reason:</strong> {rejectReason}
            </p>
            <p className="text-xs text-rose-600 mt-1">
              The form has been unlocked. Please make the requested corrections and re-submit for review.
            </p>
          </div>
        </div>
      )}

      {studentData.status === 'submitted' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center space-x-3">
          <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
            ⏳
          </span>
          <div>
            <p className="font-bold text-sm">Application Submitted & Awaiting Verification</p>
            <p className="text-xs text-amber-700">
              Your college administrative office will review your details. The form is locked while under review.
            </p>
          </div>
        </div>
      )}

      {/* Two-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Controlled Student Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Student Information</h2>
              <p className="text-xs text-gray-500">All fields marked with * are required.</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              {activeCollege.name}
            </span>
          </div>

          <StudentForm
            formData={studentData}
            onChange={handleFieldChange}
            onSaveDraft={handleSaveDraft}
            onSubmitApproval={handleSubmitForApproval}
            isLocked={isFormLocked}
            errors={errors}
          />
        </div>

        {/* Right Column: Live Sticky Card Preview with Assigned Template */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            {loadingTemplate ? (
              <div className="p-12 text-center text-xs text-gray-400">
                Loading college card template...
              </div>
            ) : (
              <IdCardPreview
                student={studentData}
                template={template}
                status={studentData.status}
              />
            )}

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Card design is automatically configured by {activeCollege.name}.
              </p>
            </div>
          </div>
        </div>
      </div>

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
