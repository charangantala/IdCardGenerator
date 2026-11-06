import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DepartmentCards from '../../components/filters/DepartmentCards';
import YearTabs from '../../components/filters/YearTabs';
import SectionFilter from '../../components/filters/SectionFilter';
import StudentTable from '../../components/tables/StudentTable';
import StudentForm from '../../components/forms/StudentForm';
import DepartmentForm from '../../components/forms/DepartmentForm';
import TemplateEditorForm from '../../components/forms/TemplateEditorForm';
import CsvImportModal from '../../components/forms/CsvImportModal';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import IdCard from '../../components/IdCard/IdCard';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { SAMPLE_DEPARTMENTS, SAMPLE_TEMPLATES } from '../../utils/sampleData';
import { exportStudentsToCsv } from '../../utils/csv';
import { downloadBatchCardsAsPdf } from '../../utils/downloadCard';
import { useAuth } from '../../context/AuthContext';
import { templateService } from '../../services/templateService';
import { studentService } from '../../services/studentService';
import {
  getStoredSections,
  saveStoredSections,
  getFacultyAdvisorForSection,
} from '../../utils/sectionData';

export default function CollegeHome() {
  const { user } = useAuth();
  const collegeName = user?.collegeName || 'MIT College of Technology';
  const collegeCode = user?.collegeCode || user?.code || 'MITC';

  // Navigation tab: 'students' vs 'templates'
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMainTab, setActiveMainTab] = useState(() => {
    return searchParams.get('tab') === 'templates' ? 'templates' : 'students';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'templates' && activeMainTab !== 'templates') {
      setActiveMainTab('templates');
    } else if (!tabParam && activeMainTab === 'templates') {
      setActiveMainTab('templates');
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveMainTab(newTab);
    if (newTab === 'templates') {
      setSearchParams({ tab: 'templates' });
    } else {
      setSearchParams({});
    }
  };

  // State (All demo students removed; loaded live from database)
  const [departments, setDepartments] = useState([...SAMPLE_DEPARTMENTS]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedDeptId, setSelectedDeptId] = useState(SAMPLE_DEPARTMENTS[0]?.id || 'dept-cse');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [sections, setSections] = useState(() => getStoredSections());
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

  // College-specific template configuration
  const [collegeTemplate, setCollegeTemplate] = useState({
    ...SAMPLE_TEMPLATES.classicBlue,
    collegeName,
    collegeCode,
  });
  const [workingTemplate, setWorkingTemplate] = useState({
    ...SAMPLE_TEMPLATES.classicBlue,
    collegeName,
    collegeCode,
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const t = await templateService.getTemplateByCollegeId(user?.college_id || 'mitc');
        if (t) {
          const merged = {
            ...t,
            collegeName: t.collegeName || collegeName,
            collegeCode: t.collegeCode || collegeCode,
          };
          setCollegeTemplate(merged);
          setWorkingTemplate(merged);
        }
      } catch (err) {
        console.error('Failed to load college template:', err);
      }
    }
    loadTemplate();
  }, [user?.college_id, collegeName, collegeCode]);

  // Load students from database & subscribe to live submissions from Student portal
  useEffect(() => {
    let isMounted = true;
    async function loadStudents() {
      try {
        setLoadingStudents(true);
        const collegeId = user?.college_id || 'mitc';
        const data = await studentService.getStudentsByCollege(collegeId);
        if (isMounted) {
          setStudents(data || []);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        if (isMounted) setLoadingStudents(false);
      }
    }
    loadStudents();

    // Real-time synchronization: when a student submits their card from /student
    const unsubscribe = studentService.subscribeToChanges((eventType, student) => {
      if (!isMounted || !student) return;

      // Multi-tenant isolation: check that this student belongs to this college
      const myCollegeId = (user?.college_id || 'mitc').toLowerCase();
      const myCollegeCode = (user?.collegeCode || user?.code || '').toLowerCase();
      const studentCollegeId = (student.college_id || 'mitc').toLowerCase();
      const studentCollegeCode = (student.collegeCode || '').toLowerCase();

      const isMyCollege =
        studentCollegeId === myCollegeId ||
        (myCollegeCode && studentCollegeCode === myCollegeCode) ||
        (myCollegeCode && studentCollegeId === myCollegeCode);

      if (!isMyCollege) return; // Don't show students from other colleges!

      setStudents((prev) => {
        const index = prev.findIndex(
          (s) =>
            s.id === student.id ||
            (student.roll_no && (s.rollNo === student.roll_no || s.roll_no === student.roll_no))
        );
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...student };
          return updated;
        }
        return [student, ...prev];
      });

      if (eventType === 'STUDENT_SUBMITTED' || eventType === 'INSERT') {
        showToast(
          `🔔 New card application received from ${student.name} (Year ${student.year}, Sec ${student.section || 'A'})!`,
          'info'
        );
      } else if (eventType === 'STUDENT_DELETED' || eventType === 'DELETE') {
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.college_id]);

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

  // Sections active for current year and department
  const activeYearSections = useMemo(() => {
    if (selectedYear === 'all') {
      const deptSections = sections.filter((s) => s.department_id === selectedDeptId);
      const seen = new Set();
      return deptSections.filter((s) => {
        if (seen.has(s.code)) return false;
        seen.add(s.code);
        return true;
      });
    }
    return sections.filter(
      (s) => s.department_id === selectedDeptId && Number(s.year) === Number(selectedYear)
    );
  }, [sections, selectedDeptId, selectedYear]);

  // Active section faculty advisor
  const activeFaculty = useMemo(() => {
    return getFacultyAdvisorForSection(
      sections,
      selectedDeptId,
      selectedYear === 'all' ? 1 : selectedYear,
      selectedSection === 'all' ? 'A' : selectedSection
    );
  }, [sections, selectedDeptId, selectedYear, selectedSection]);

  // Student counts by section in current active year
  const studentCountsBySection = useMemo(() => {
    const counts = {};
    students
      .filter((s) => {
        if (s.department_id !== selectedDeptId) return false;
        if (selectedYear !== 'all' && Number(s.year) !== Number(selectedYear)) return false;
        return true;
      })
      .forEach((s) => {
        const code = (s.section || 'A').toUpperCase();
        counts[code] = (counts[code] || 0) + 1;
      });
    return counts;
  }, [students, selectedDeptId, selectedYear]);

  // Filtered students for display with approver metadata
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (s.department_id !== selectedDeptId) return false;
        if (selectedYear !== 'all' && Number(s.year) !== Number(selectedYear)) return false;
        if (
          selectedSection !== 'all' &&
          (s.section || 'A').toUpperCase() !== String(selectedSection).toUpperCase()
        )
          return false;
        if (statusFilter !== 'all' && s.status !== statusFilter) return false;
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const matchesName = s.name?.toLowerCase().includes(query);
          const matchesRoll = (s.rollNo || s.roll_no)?.toLowerCase().includes(query);
          if (!matchesName && !matchesRoll) return false;
        }
        return true;
      })
      .map((st) => {
        const advisor = getFacultyAdvisorForSection(
          sections,
          st.department_id,
          st.year,
          st.section || 'A'
        );
        return {
          ...st,
          approver_name: st.approved_by || advisor?.name || 'Section In-Charge',
        };
      });
  }, [students, selectedDeptId, selectedYear, selectedSection, statusFilter, searchTerm, sections]);

  // Approved students eligible for batch PDF
  const approvedStudents = useMemo(() => {
    return filteredStudents.filter((s) => s.status === 'approved');
  }, [filteredStudents]);

  // Representative student for live ID card template preview
  const previewStudent = useMemo(() => {
    if (students && students.length > 0) {
      const approvedWithPhoto = students.find((s) => s.status === 'approved' && (s.photoUrl || s.photo_url));
      const withPhoto = students.find((s) => s.photoUrl || s.photo_url);
      const chosen = approvedWithPhoto || withPhoto || students[0];
      return {
        ...chosen,
        name: chosen.name || 'Sample Student',
        rollNo: chosen.rollNo || chosen.roll_no || `${collegeTemplate.collegeCode || collegeCode}-2024-042`,
        department: chosen.department_name || chosen.department || activeDepartment?.name || 'Computer Science & Engineering',
        collegeName: workingTemplate.collegeName || collegeName,
        collegeCode: workingTemplate.collegeCode || collegeCode,
        status: 'approved',
      };
    }
    return {
      id: 'preview-sample-1',
      name: 'Samantha Sharma',
      rollNo: `${(collegeTemplate.collegeCode || collegeCode)}-2024-042`,
      department: activeDepartment?.name || 'Computer Science & Engineering',
      year: 2,
      section: 'A',
      bloodGroup: 'O+',
      phone: '+91 98765 43210',
      email: `student@${(collegeTemplate.collegeCode || collegeCode).toLowerCase()}.edu`,
      status: 'approved',
      validUntil: '2027-06-30',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      collegeName: workingTemplate.collegeName || collegeName,
      collegeCode: workingTemplate.collegeCode || collegeCode,
    };
  }, [students, workingTemplate.collegeName, workingTemplate.collegeCode, collegeName, collegeCode, collegeTemplate.collegeCode, activeDepartment]);

  // Available templates from Admin Showcase
  const showcasePresets = useMemo(() => [
    {
      key: 'classicBlue',
      name: 'Classic Navy (Vertical)',
      badge: 'Academic Standard',
      layout: 'vertical',
      photoShape: 'circle',
      font: 'Poppins',
      primaryColor: '#1e3a8a',
      secondaryColor: '#f59e0b',
      bgColor: '#ffffff',
      description: 'Traditional portrait card with navy header banner, gold crest highlights, and circular passport photo.',
    },
    {
      key: 'modernEmerald',
      name: 'Modern Emerald (Horizontal)',
      badge: 'Landscape Style',
      layout: 'horizontal',
      photoShape: 'rounded',
      font: 'Montserrat',
      primaryColor: '#065f46',
      secondaryColor: '#10b981',
      bgColor: '#f8fafc',
      description: 'Contemporary widescreen card with rounded photo frame, clean emerald banner, and two-column data layout.',
    },
    {
      key: 'crimsonTech',
      name: 'Crimson Tech (Vertical)',
      badge: 'Engineering & Tech',
      layout: 'vertical',
      photoShape: 'square',
      font: 'Inter',
      primaryColor: '#991b1b',
      secondaryColor: '#dc2626',
      bgColor: '#fafafa',
      description: 'High-contrast ruby & dark slate portrait format with sharp square photo and prominent verification barcode.',
    },
    {
      key: 'royalIndigo',
      name: 'Royal Indigo (Vertical)',
      badge: 'Premium University',
      layout: 'vertical',
      photoShape: 'rounded',
      font: 'Poppins',
      primaryColor: '#3730a3',
      secondaryColor: '#f59e0b',
      bgColor: '#ffffff',
      description: 'Rich royal indigo with warm amber badge accents, rounded corners, and official university seal positioning.',
    },
    {
      key: 'slateCyber',
      name: 'Cyber Slate (Horizontal)',
      badge: 'Tech & Research',
      layout: 'horizontal',
      photoShape: 'rounded',
      font: 'Roboto',
      primaryColor: '#0f172a',
      secondaryColor: '#06b6d4',
      bgColor: '#f8fafc',
      description: 'Minimalist deep slate horizontal badge with electric cyan accents, compact metrics, and QR validation block.',
    },
  ], []);

  // Check if a preset is the currently active one for students
  const isPresetActive = (presetKey) => {
    const preset = SAMPLE_TEMPLATES[presetKey];
    if (!preset) return false;
    return (
      collegeTemplate.layout === preset.layout &&
      collegeTemplate.colors?.primary?.toLowerCase() === preset.colors?.primary?.toLowerCase() &&
      collegeTemplate.photoShape === preset.photoShape
    );
  };

  // Check if a preset is currently being edited in the studio
  const isPresetBeingEdited = (presetKey) => {
    const preset = SAMPLE_TEMPLATES[presetKey];
    if (!preset) return false;
    return (
      workingTemplate.layout === preset.layout &&
      workingTemplate.colors?.primary?.toLowerCase() === preset.colors?.primary?.toLowerCase()
    );
  };

  // Load a preset into the customizer form
  const handleLoadPreset = (presetKey) => {
    const preset = SAMPLE_TEMPLATES[presetKey];
    if (!preset) return;
    const merged = {
      ...preset,
      collegeName: workingTemplate.collegeName || collegeName,
      collegeCode: workingTemplate.collegeCode || collegeCode,
      collegeLogo: workingTemplate.collegeLogo || collegeTemplate.collegeLogo || null,
    };
    setWorkingTemplate(merged);
    showToast(`Loaded "${preset.name}". You can now customize colors, logo, and fields below!`, 'info');
  };

  // Select and immediately activate a preset for all students
  const handleSelectAndActivatePreset = async (presetKey) => {
    const preset = SAMPLE_TEMPLATES[presetKey];
    if (!preset) return;
    const merged = {
      ...preset,
      collegeName: workingTemplate.collegeName || collegeName,
      collegeCode: workingTemplate.collegeCode || collegeCode,
      collegeLogo: workingTemplate.collegeLogo || collegeTemplate.collegeLogo || null,
    };
    setWorkingTemplate(merged);
    await handleActivateTemplate(merged);
  };

  // Activate the working template as the official college design for all students
  const handleActivateTemplate = async (templateToSave = workingTemplate) => {
    try {
      setSavingTemplate(true);
      const collegeId = user?.college_id || 'mitc';
      const toSave = {
        ...templateToSave,
        collegeName: templateToSave.collegeName || collegeName,
        collegeCode: templateToSave.collegeCode || collegeCode,
      };
      const saved = await templateService.updateTemplate(collegeId, toSave);
      setCollegeTemplate(saved);
      setWorkingTemplate(saved);
      showToast(
        `🎉 Template "${toSave.name || 'Custom Design'}" successfully activated! Students of ${collegeName} will now see only this template in their dashboard.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to activate template:', err);
      showToast('Could not activate template. Please try again.', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  // Reset customizer to default layout
  const handleResetTemplate = () => {
    const defaultT = {
      ...SAMPLE_TEMPLATES.classicBlue,
      collegeName,
      collegeCode,
      collegeLogo: null,
    };
    setWorkingTemplate(defaultT);
    showToast('Reset template customizer to default Classic Navy layout.', 'info');
  };

  // -------------------------------------------------------------
  // Bulk CSV Handlers
  // -------------------------------------------------------------
  const handleBulkImportComplete = async (importedStudents) => {
    const collegeId = user?.college_id || 'mitc';
    const saved = [];
    for (const st of importedStudents) {
      try {
        const result = await studentService.createStudent(collegeId, st);
        saved.push(result);
      } catch (e) {
        console.error('Failed to import student:', st, e);
      }
    }
    setStudents((prev) => [...saved, ...prev]);
    showToast(`Successfully imported ${saved.length} students into database!`, 'success');
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
        section: selectedSection === 'all' ? 'A' : selectedSection,
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

  const handleUpdateSectionFaculty = (sectionId, facultyData) => {
    const updated = sections.map((sec) =>
      sec.id === sectionId ? { ...sec, ...facultyData } : sec
    );
    setSections(updated);
    saveStoredSections(updated);
    showToast(`Assigned ${facultyData.faculty_name} as Section In-Charge!`, 'success');
  };

  const handleAddSection = (newSec) => {
    const newSecObj = {
      ...newSec,
      id: `sec-${Date.now()}`,
      college_id: user?.college_id || 'mitc',
      department_id: selectedDeptId,
      year: selectedYear === 'all' ? 1 : Number(selectedYear),
    };
    const updated = [...sections, newSecObj];
    setSections(updated);
    saveStoredSections(updated);
    showToast(`Section ${newSec.code} created with ${newSec.faculty_name} as Approver!`, 'success');
  };

  const handleSaveStudent = (field, val) => {
    setStudentModal((prev) => ({
      ...prev,
      student: { ...prev.student, [field]: val },
    }));
  };

  const handleStudentFormSubmit = async () => {
    const s = studentModal.student;
    if (!s.name?.trim() || !s.rollNo?.trim()) {
      showToast('Please provide both student name and roll number.', 'error');
      return;
    }
    const collegeId = user?.college_id || 'mitc';

    if (s.id && !s.id.startsWith('new-')) {
      const updated = await studentService.updateStudent(collegeId, s.id, s);
      setStudents((prev) => prev.map((item) => (item.id === s.id ? { ...item, ...updated } : item)));
      showToast(`Student "${s.name}" updated!`, 'success');
    } else {
      const created = await studentService.createStudent(collegeId, s);
      setStudents((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
      showToast(`Student "${created.name}" enrolled into database!`, 'success');
    }
    setStudentModal({ isOpen: false, student: null });
  };

  const handleDeleteStudent = (student) => {
    setDeleteConfirm({ isOpen: true, type: 'student', item: student });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.type === 'student') {
      const collegeId = user?.college_id || 'mitc';
      await studentService.deleteStudent(collegeId, deleteConfirm.item.id);
      setStudents((prev) => prev.filter((s) => s.id !== deleteConfirm.item.id));
      showToast('Student record deleted from database.', 'info');
    } else if (deleteConfirm.type === 'department') {
      setDepartments((prev) => prev.filter((d) => d.id !== deleteConfirm.item.id));
      const remaining = departments.filter((d) => d.id !== deleteConfirm.item.id);
      if (remaining.length > 0) setSelectedDeptId(remaining[0].id);
      showToast('Department removed.', 'info');
    }
    setDeleteConfirm({ isOpen: false, type: '', item: null });
  };

  const handleApproveStudent = async (student) => {
    const advisor = getFacultyAdvisorForSection(
      sections,
      student.department_id,
      student.year,
      student.section || 'A'
    );
    const approverName = advisor?.name || 'Assigned Faculty Advisor';
    const collegeId = user?.college_id || 'mitc';

    await studentService.updateStatus(collegeId, student.id, 'approved', null, approverName);

    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, status: 'approved', approved_by: approverName, reject_reason: null }
          : s
      )
    );
    showToast(`Approved ID card for ${student.name} (Endorsed by ${approverName})!`, 'success');
  };

  const handleOpenRejectModal = (student) => {
    setRejectModal({
      isOpen: true,
      student,
      reason: 'Photo is blurry or does not meet passport standard; please re-upload.',
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.reason.trim()) {
      showToast('Please specify a rejection reason.', 'error');
      return;
    }
    const collegeId = user?.college_id || 'mitc';
    await studentService.updateStatus(collegeId, rejectModal.student.id, 'rejected', rejectModal.reason.trim());

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
      {/* Header */}
      <div className="border-b pb-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
            College Administration
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            {collegeName}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage degree programs, student cohorts, section approvals, and institution card design.
          </p>
        </div>

        {/* Active Template Quick Status Badge */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Official Student Template
            </span>
            <span className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {collegeTemplate?.name || 'Classic Navy'} ({collegeTemplate?.layout || 'vertical'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleTabChange('templates')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            Change Design 🎨
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleTabChange('students')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeMainTab === 'students'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>👥</span>
            <span>Student Cohorts & Section Approvals</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeMainTab === 'students' ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {students.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('templates')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeMainTab === 'templates'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span>🎨</span>
            <span>Card Showcase & Template Studio</span>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                activeMainTab === 'templates'
                  ? 'bg-emerald-400 text-slate-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Live Sync
            </span>
          </button>
        </div>

        {activeMainTab === 'students' ? (
          /* Action Buttons Toolbar for Students Tab */
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
        ) : (
          /* Top Action for Template Studio */
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleActivateTemplate(workingTemplate)}
              disabled={savingTemplate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              {savingTemplate ? 'Activating...' : '★ Select & Activate This Template for All Students'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeMainTab === 'students' ? (
        <>
          {/* 1. Departments Grid */}
          <section>
            <DepartmentCards
              departments={departments}
              selectedId={selectedDeptId}
              onSelect={(id) => {
                setSelectedDeptId(id);
                setSelectedYear('all');
                setSelectedSection('all');
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
              onSelectYear={(yr) => {
                setSelectedYear(yr);
                setSelectedSection('all');
              }}
              studentCountsByYear={studentCountsByYear}
            />

            {/* Section Division & Faculty In-Charge Spotlight */}
            <SectionFilter
              sections={activeYearSections}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
              studentCountsBySection={studentCountsBySection}
              activeFaculty={activeFaculty}
              onUpdateSectionFaculty={handleUpdateSectionFaculty}
              onAddSection={handleAddSection}
              selectedYear={selectedYear}
              departmentName={activeDepartment?.name}
            />

            {/* Student Table */}
            <StudentTable
              students={filteredStudents}
              loading={loadingStudents}
              onViewCard={(student) => setCardPreviewModal({ isOpen: true, student })}
              onEdit={(student) => setStudentModal({ isOpen: true, student })}
              onDelete={handleDeleteStudent}
              onApprove={handleApproveStudent}
              onReject={handleOpenRejectModal}
              onAddNew={handleOpenAddStudent}
            />
          </section>
        </>
      ) : (
        /* ID Card Showcase & Customization Studio */
        <div className="space-y-8">
          {/* Active Template Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Official Student Template
                </span>
                <span className="text-xs text-blue-200 uppercase font-semibold">
                  {collegeName}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {collegeTemplate?.name || 'Classic Navy (Vertical)'}
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                When you click <strong>"Select & Activate This Template"</strong>, this exact card configuration becomes the mandatory design displayed and downloaded by all students in their student dashboard (<code className="text-emerald-300 font-mono text-xs">/student</code>).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={handleResetTemplate}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Reset to Defaults
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => handleActivateTemplate(workingTemplate)}
                disabled={savingTemplate}
                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg font-bold"
              >
                {savingTemplate ? 'Activating Template...' : '★ Select & Activate for All Students'}
              </Button>
            </div>
          </div>

          {/* Section 1: Template Showcase Presets (from Admin) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="border-b pb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                  Template Showcase
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mt-1">
                  1. Available ID Card Templates (Admin Showcase)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Choose from pre-designed templates available in Admin. Click <strong>"Select & Activate"</strong> to apply it to all your students, or <strong>"Load & Customize"</strong> to adjust colors and logo first.
                </p>
              </div>
            </div>

            {/* Presets Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {showcasePresets.map((preset) => {
                const isActive = isPresetActive(preset.key);
                const isEditing = isPresetBeingEdited(preset.key);

                return (
                  <div
                    key={preset.key}
                    className={`rounded-2xl border transition-all duration-200 p-4 flex flex-col justify-between ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-md ring-2 ring-emerald-400/40'
                        : isEditing
                        ? 'border-blue-400 bg-blue-50/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Header & Badges */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {preset.badge}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            ✓ Active
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 leading-snug">
                        {preset.name}
                      </h4>

                      <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                        {preset.description}
                      </p>

                      {/* Visual Mockup Card Representation */}
                      <div className="my-3 py-3 px-2 bg-slate-100 rounded-xl flex items-center justify-center">
                        {preset.layout === 'vertical' ? (
                          /* Miniature Vertical Card */
                          <div
                            className="w-24 h-36 rounded-lg shadow-sm border overflow-hidden flex flex-col justify-between"
                            style={{ backgroundColor: preset.bgColor, borderColor: preset.primaryColor }}
                          >
                            <div
                              className="h-7 w-full flex items-center justify-center px-1"
                              style={{ backgroundColor: preset.primaryColor }}
                            >
                              <span className="text-[8px] font-extrabold text-white truncate max-w-full">
                                {collegeTemplate?.collegeCode || collegeCode}
                              </span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-1">
                              <div
                                className={`w-8 h-8 border flex items-center justify-center text-[10px] bg-slate-200 ${
                                  preset.photoShape === 'circle'
                                    ? 'rounded-full'
                                    : preset.photoShape === 'rounded'
                                    ? 'rounded-md'
                                    : 'rounded-none'
                                }`}
                                style={{ borderColor: preset.secondaryColor }}
                              >
                                👤
                              </div>
                              <div className="w-12 h-1 bg-gray-300 rounded mt-1.5" />
                              <div className="w-16 h-1 bg-gray-200 rounded mt-1" />
                              <div className="w-10 h-1 bg-gray-200 rounded mt-1" />
                            </div>
                            <div
                              className="h-2 w-full"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                          </div>
                        ) : (
                          /* Miniature Horizontal Card */
                          <div
                            className="w-36 h-24 rounded-lg shadow-sm border overflow-hidden flex flex-col justify-between"
                            style={{ backgroundColor: preset.bgColor, borderColor: preset.primaryColor }}
                          >
                            <div
                              className="h-5 w-full flex items-center justify-between px-2"
                              style={{ backgroundColor: preset.primaryColor }}
                            >
                              <span className="text-[8px] font-extrabold text-white truncate">
                                {collegeTemplate?.collegeCode || collegeCode}
                              </span>
                              <span className="text-[7px] text-white/80">ID CARD</span>
                            </div>
                            <div className="flex items-center px-2 py-1 space-x-2">
                              <div
                                className={`w-7 h-7 border flex items-center justify-center text-[9px] bg-slate-200 flex-shrink-0 ${
                                  preset.photoShape === 'circle'
                                    ? 'rounded-full'
                                    : preset.photoShape === 'rounded'
                                    ? 'rounded-md'
                                    : 'rounded-none'
                                }`}
                                style={{ borderColor: preset.secondaryColor }}
                              >
                                👤
                              </div>
                              <div className="space-y-1 flex-1">
                                <div className="w-14 h-1 bg-gray-400 rounded" />
                                <div className="w-10 h-1 bg-gray-300 rounded" />
                                <div className="w-12 h-1 bg-gray-200 rounded" />
                              </div>
                            </div>
                            <div
                              className="h-2 w-full flex justify-end px-2"
                              style={{ backgroundColor: preset.primaryColor }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Specs / Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-600 mb-3 font-mono">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                          {preset.layout}
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded capitalize">
                          {preset.photoShape} photo
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                          {preset.font}
                        </span>
                      </div>

                      {/* Palette Swatches */}
                      <div className="flex items-center space-x-1.5 mb-4">
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-xs"
                          style={{ backgroundColor: preset.primaryColor }}
                          title={`Primary: ${preset.primaryColor}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-xs"
                          style={{ backgroundColor: preset.secondaryColor }}
                          title={`Secondary: ${preset.secondaryColor}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-xs"
                          style={{ backgroundColor: preset.bgColor }}
                          title={`Background: ${preset.bgColor}`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <Button
                        variant="primary"
                        size="xs"
                        className={`w-full justify-center ${
                          isActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''
                        }`}
                        onClick={() => handleSelectAndActivatePreset(preset.key)}
                        disabled={savingTemplate}
                      >
                        {isActive ? '✓ Currently Active' : '★ Select & Activate'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="xs"
                        className="w-full justify-center"
                        onClick={() => handleLoadPreset(preset.key)}
                      >
                        Load & Customize ✏️
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Interactive Customization Studio */}
          <div className="space-y-4">
            <div className="border-b pb-2 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
                  Live Customizer
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight mt-1">
                  2. Customize Template to College Requirements
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload your official college logo, fine-tune colors, fonts, and photo shape. The card preview updates live.
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => handleActivateTemplate(workingTemplate)}
                disabled={savingTemplate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {savingTemplate ? 'Activating...' : '★ Select & Activate This Template for All Students'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Template Editor Form */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <TemplateEditorForm
                  template={workingTemplate}
                  onChange={(updated) => setWorkingTemplate(updated)}
                  onSave={() => handleActivateTemplate(workingTemplate)}
                  onReset={handleResetTemplate}
                />
              </div>

              {/* Right Column: Sticky Live ID Card Preview */}
              <div className="lg:col-span-5 sticky top-20 space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
                  {/* Live Preview Header */}
                  <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                    <div>
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                        Student Live View Preview
                      </span>
                      <span className="text-[11px] text-gray-400">
                        Exact card students will see and download
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                      {workingTemplate.layout === 'horizontal' ? 'Horizontal Card' : 'Vertical Card'}
                    </span>
                  </div>

                  {/* Live IdCard Component */}
                  <div className="w-full flex justify-center py-2 overflow-x-auto">
                    <IdCardPreview
                      student={previewStudent}
                      template={workingTemplate}
                      status="approved"
                    />
                  </div>

                  {/* Explanation Box */}
                  <div className="w-full mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                    <div className="flex items-start space-x-2">
                      <span className="text-blue-600 text-sm">💡</span>
                      <p className="text-xs text-blue-900 leading-snug">
                        <strong>Student Portal Exclusivity:</strong> When you click <em>Select & Activate This Template</em>, this template is stored as the official design for <strong>{collegeName}</strong>. Students visiting their dashboard (<code className="font-mono text-xs text-blue-700">/student</code>) will only see and download this exact design.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Big Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-4 justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3 shadow-md"
                    onClick={() => handleActivateTemplate(workingTemplate)}
                    disabled={savingTemplate}
                  >
                    {savingTemplate
                      ? 'Activating Template...'
                      : '★ Select & Activate This Template for All Students'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              template={collegeTemplate}
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
              template={collegeTemplate}
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
