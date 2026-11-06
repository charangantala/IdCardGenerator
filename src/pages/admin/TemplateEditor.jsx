import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TemplateEditorForm from '../../components/forms/TemplateEditorForm';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { SAMPLE_STUDENTS, SAMPLE_TEMPLATES } from '../../utils/sampleData';
import { templateService } from '../../services/templateService';

const AVAILABLE_COLLEGES = [
  { id: 'mitc', name: 'MIT College of Technology', code: 'MITC' },
  { id: 'ait', name: 'Apex Institute of Technology', code: 'AIT' },
  { id: 'sec', name: 'Stanford Engineering College', code: 'SEC' },
];

export default function TemplateEditor() {
  const { id = 'mitc' } = useParams();
  const navigate = useNavigate();

  const [selectedCollegeId, setSelectedCollegeId] = useState(id.toLowerCase());
  const activeCollege =
    AVAILABLE_COLLEGES.find((c) => c.id === selectedCollegeId) || {
      id: selectedCollegeId,
      name: selectedCollegeId.toUpperCase(),
      code: selectedCollegeId.toUpperCase(),
    };

  const [template, setTemplate] = useState({ ...SAMPLE_TEMPLATES.classicBlue });
  const [loading, setLoading] = useState(true);
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);
  const [toast, setToast] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  // Load the assigned template for the selected college
  useEffect(() => {
    async function loadCollegeTemplate() {
      setLoading(true);
      try {
        const t = await templateService.getTemplateByCollegeId(selectedCollegeId);
        setTemplate({
          ...t,
          collegeName: activeCollege.name,
          collegeCode: activeCollege.code,
        });
      } catch (err) {
        console.error('Failed to load template:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCollegeTemplate();
  }, [selectedCollegeId, activeCollege.name, activeCollege.code]);

  const activeStudent = {
    ...SAMPLE_STUDENTS[previewStudentIndex],
    collegeName: activeCollege.name,
    collegeCode: activeCollege.code,
    collegeLogo: template.collegeLogo,
  };

  const handleCollegeSwitch = (newId) => {
    setSelectedCollegeId(newId);
    navigate(`/admin/colleges/${newId}/template`, { replace: true });
  };

  const handleSave = async () => {
    try {
      await templateService.updateTemplate(selectedCollegeId, {
        ...template,
        collegeName: activeCollege.name,
        collegeCode: activeCollege.code,
      });

      setToast({
        message: `Template successfully assigned & saved to ${activeCollege.name}! Students will now see this card design.`,
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: 'Failed to save template. Please try again.',
        type: 'error',
      });
    }
    setTimeout(() => setToast(null), 5000);
  };

  const handleReset = () => {
    const baseDefault =
      selectedCollegeId === 'ait'
        ? SAMPLE_TEMPLATES.modernEmerald
        : selectedCollegeId === 'sec'
        ? SAMPLE_TEMPLATES.crimsonTech
        : SAMPLE_TEMPLATES.classicBlue;

    setTemplate({
      ...baseDefault,
      collegeName: activeCollege.name,
      collegeCode: activeCollege.code,
    });
    setToast({
      message: 'Template reset to defaults.',
      type: 'info',
    });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-blue-600 transition-colors">
              Colleges
            </Link>
            <span>/</span>
            <span className="font-bold text-gray-700 uppercase">{activeCollege.code}</span>
            <span>/</span>
            <span className="text-blue-600 uppercase font-bold">Template Designer</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            ID Card Template Designer
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Customize the card design and assign it to a partner college. All students of this college will immediately receive this template.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowJsonModal(true)}
          >
            Inspect JSON 🔍
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            Assign & Save to {activeCollege.code} 💾
          </Button>
        </div>
      </div>

      {/* College Selector Bar */}
      <div className="p-4 bg-slate-100/90 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Editing Template For:
          </span>
          <select
            value={selectedCollegeId}
            onChange={(e) => handleCollegeSwitch(e.target.value)}
            className="text-xs font-bold bg-white text-blue-700 px-3 py-1.5 rounded-lg border border-gray-300 shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {AVAILABLE_COLLEGES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>Active College:</span>
          <span className="font-bold text-gray-800">{activeCollege.name}</span>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Template Editor Controls */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">
              Loading college template...
            </div>
          ) : (
            <TemplateEditorForm
              template={template}
              onChange={setTemplate}
              onSave={handleSave}
              onReset={handleReset}
              collegeName={activeCollege.name}
              collegeCode={activeCollege.code}
            />
          )}
        </div>

        {/* Right Column: Sticky Live ID Card Preview */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            {/* Student Preview Selector */}
            <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Preview With Student:
              </span>
              <div className="flex space-x-1">
                {SAMPLE_STUDENTS.slice(0, 3).map((st, i) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setPreviewStudentIndex(i)}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                      previewStudentIndex === i
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {st.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Live IdCard Component */}
            <IdCardPreview
              student={activeStudent}
              template={template}
              status="approved"
            />

            <div className="mt-4 pt-3 border-t text-center space-y-2">
              <span className="text-[11px] text-gray-400 block">
                Live Preview updates instantly on every change.
              </span>
              <Link
                to="/student"
                className="inline-block text-xs text-blue-600 hover:underline font-bold"
              >
                Go to Student Portal to verify card →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* JSON Viewer Modal */}
      <Modal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        title="Template Configuration JSON"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            This JSON represents the exact <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-700">template_config</code> stored for {activeCollege.name}.
          </p>
          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-96">
            {JSON.stringify(template, null, 2)}
          </pre>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(template, null, 2));
                setToast({ message: 'JSON copied to clipboard!', type: 'info' });
                setShowJsonModal(false);
              }}
            >
              Copy JSON
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
