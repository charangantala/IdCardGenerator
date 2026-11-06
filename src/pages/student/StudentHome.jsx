import React, { useState, useEffect } from 'react';
import StudentForm from '../../components/forms/StudentForm';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import Toast from '../../components/common/Toast';
import { SAMPLE_TEMPLATES } from '../../utils/sampleData';
import { validateStudent, validateStudentField } from '../../utils/validators';
import { templateService } from '../../services/templateService';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM_STATE = {
  name: '',
  rollNo: '',
  roll_no: '',
  department: 'Computer Science & Engineering',
  department_name: 'Computer Science & Engineering',
  department_id: 'dept-cse',
  year: 1,
  section: 'A',
  dob: '',
  gender: 'Male',
  bloodGroup: 'O+',
  blood_group: 'O+',
  phone: '',
  email: '',
  address: '',
  guardian_name: '',
  photoUrl: '',
  photo_url: '',
  status: 'draft',
  college_id: 'mitc',
  collegeName: 'MIT College of Technology',
  collegeCode: 'MITC',
  validUntil: '2027-06-30',
  valid_until: '2027-06-30',
};

export default function StudentHome() {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState(() => {
    try {
      const saved = localStorage.getItem('cardcraft_current_student');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read cached student application:', e);
    }
    return {
      ...INITIAL_FORM_STATE,
      email: user?.email || '',
      name: user?.role === 'student' ? (user?.full_name || '') : '',
      college_id: user?.college_id || 'mitc',
      collegeName: user?.collegeName || 'MIT College of Technology',
    };
  });

  const [template, setTemplate] = useState({ ...SAMPLE_TEMPLATES.classicBlue });
  const [errors, setErrors] = useState({});
  const [rejectReason, setRejectReason] = useState('Please upload a clear passport photo with a plain white background.');
  const [toast, setToast] = useState(null);

  // Load college's active template (including logo & colors)
  useEffect(() => {
    async function fetchCollegeTemplate() {
      try {
        const collegeId = studentData.college_id || user?.college_id || 'mitc';
        const t = await templateService.getTemplateByCollegeId(collegeId);
        if (t) setTemplate(t);
      } catch (err) {
        console.error('Failed to load template in student view:', err);
      }
    }
    fetchCollegeTemplate();
  }, [studentData.college_id, user?.college_id]);

  // Subscribe to real-time status updates from College Dashboard
  useEffect(() => {
    const unsubscribe = studentService.subscribeToChanges((eventType, updated) => {
      if (!updated) return;

      // Check if the change applies to this student
      const matches =
        (studentData.id && updated.id === studentData.id) ||
        (studentData.rollNo && (updated.rollNo === studentData.rollNo || updated.roll_no === studentData.rollNo));

      if (matches) {
        setStudentData((prev) => {
          const merged = { ...prev, ...updated };
          localStorage.setItem('cardcraft_current_student', JSON.stringify(merged));
          return merged;
        });

        if (updated.status === 'approved') {
          showToast(`🎉 Congratulations! Your ID card has been APPROVED by ${updated.approved_by || 'the College'}!`, 'success');
        } else if (updated.status === 'rejected') {
          if (updated.reject_reason) setRejectReason(updated.reject_reason);
          showToast(`⚠️ Your card application was rejected. Please review feedback.`, 'error');
        }
      }
    });

    return () => unsubscribe();
  }, [studentData.id, studentData.rollNo]);

  // Real-time update on every keystroke
  const handleFieldChange = (name, value) => {
    setStudentData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'rollNo') updated.roll_no = value;
      if (name === 'department') updated.department_name = value;
      if (name === 'bloodGroup') updated.blood_group = value;
      return updated;
    });

    // Clear or check field validation in real-time
    const fieldError = validateStudentField(name, value, studentData);
    setErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));
  };

  const handleSaveDraft = async () => {
    try {
      const collegeId = studentData.college_id || user?.college_id || 'mitc';
      const drafted = await studentService.createStudent(collegeId, {
        ...studentData,
        status: 'draft',
      });
      setStudentData(drafted);
      localStorage.setItem('cardcraft_current_student', JSON.stringify(drafted));
      showToast('Draft saved successfully! You can continue editing anytime.', 'info');
    } catch (err) {
      console.error('Draft save failed:', err);
      showToast('Draft saved locally.', 'info');
    }
  };

  const handleSubmitForApproval = async () => {
    const { isValid, errors: validationErrors } = validateStudent(studentData);
    if (!isValid) {
      setErrors(validationErrors);
      showToast('Please fix the validation errors before submitting.', 'error');
      return;
    }

    try {
      const collegeId = studentData.college_id || user?.college_id || 'mitc';
      const submitted = await studentService.createStudent(collegeId, {
        ...studentData,
        status: 'submitted',
      });
      setStudentData(submitted);
      localStorage.setItem('cardcraft_current_student', JSON.stringify(submitted));
      showToast('🚀 ID card submitted! Your application is now visible in the College Dashboard.', 'success');
    } catch (err) {
      console.error('Submission failed:', err);
      showToast('Failed to submit application. Please try again.', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Status simulation for instant testing
  const handleSimulateStatus = (newStatus) => {
    setStudentData((prev) => {
      const updated = { ...prev, status: newStatus };
      if (newStatus === 'approved') updated.approved_by = 'Section In-Charge';
      localStorage.setItem('cardcraft_current_student', JSON.stringify(updated));
      studentService.broadcastChange('STUDENT_UPDATED', updated);
      return updated;
    });
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
            Fill in your details on the left. The live ID card preview updates instantly on every keystroke.
          </p>
        </div>

        {/* Quick Testing Workflow Bar for Reviewers */}
        <div className="bg-slate-100 p-2 rounded-xl flex items-center space-x-2 border border-slate-200">
          <span className="text-[11px] font-bold text-gray-500 uppercase px-1">
            Status Simulator:
          </span>
          <button
            type="button"
            onClick={() => handleSimulateStatus('draft')}
            className={`px-2.5 py-1 text-xs rounded font-medium ${
              studentData.status === 'draft'
                ? 'bg-gray-800 text-white font-bold shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Draft
          </button>
          <button
            type="button"
            onClick={() => handleSimulateStatus('submitted')}
            className={`px-2.5 py-1 text-xs rounded font-medium ${
              studentData.status === 'submitted'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Submitted
          </button>
          <button
            type="button"
            onClick={() => handleSimulateStatus('approved')}
            className={`px-2.5 py-1 text-xs rounded font-medium ${
              studentData.status === 'approved'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => handleSimulateStatus('rejected')}
            className={`px-2.5 py-1 text-xs rounded font-medium ${
              studentData.status === 'rejected'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Rejected
          </button>
        </div>
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
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
              ⏳
            </span>
            <div>
              <p className="font-bold text-sm">Application Submitted & Awaiting Faculty Review</p>
              <p className="text-xs text-amber-700">
                Your designated Section In-Charge faculty member is reviewing your submitted details and photo standard.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-amber-200 text-amber-800 px-3 py-1 rounded-full">
            Section Review
          </span>
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
            <span className="text-xs font-medium text-gray-400">
              {studentData.collegeName || 'MITC'}
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

        {/* Right Column: Live Sticky Card Preview with Real PNG/PDF Export */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <IdCardPreview
              student={studentData}
              template={template}
              status={studentData.status}
            />

            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                Preview updates immediately on every keystroke.
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
