import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import TemplateEditorForm from '../../components/forms/TemplateEditorForm';
import IdCardPreview from '../../components/IdCard/IdCardPreview';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { SAMPLE_STUDENTS, SAMPLE_TEMPLATES } from '../../utils/sampleData';

const COLLEGES_MAP = {
  mitc: { id: 'mitc', name: 'MIT College of Technology', code: 'MITC' },
  ait: { id: 'ait', name: 'Apex Institute of Technology', code: 'AIT' },
  sec: { id: 'sec', name: 'Stanford Engineering College', code: 'SEC' },
};

export default function TemplateEditor() {
  const { id = 'mitc' } = useParams();
  const college = COLLEGES_MAP[id] || { id, name: id.toUpperCase(), code: id.toUpperCase() };

  // Current template state
  const [template, setTemplate] = useState({
    ...SAMPLE_TEMPLATES.classicBlue,
    collegeName: college.name,
    collegeCode: college.code,
  });

  // Selected preview student index
  const [previewStudentIndex, setPreviewStudentIndex] = useState(0);
  const [toast, setToast] = useState(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const activeStudent = {
    ...SAMPLE_STUDENTS[previewStudentIndex],
    collegeName: college.name,
    collegeCode: college.code,
  };

  const handleSave = () => {
    // In Phase 3: Mock save in state; in Phase 7: saves to Supabase colleges.template_config
    setToast({
      message: `Template configuration saved successfully for ${college.name}!`,
      type: 'success',
    });
    setTimeout(() => setToast(null), 4000);
  };

  const handleReset = () => {
    setTemplate({
      ...SAMPLE_TEMPLATES.classicBlue,
      collegeName: college.name,
      collegeCode: college.code,
    });
    setToast({
      message: 'Template reset to default specifications.',
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
            <Link to={`/admin/colleges/${id}`} className="hover:text-blue-600 transition-colors">
              {college.code}
            </Link>
            <span>/</span>
            <span className="text-blue-600 uppercase">Card Template</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Template Editor: {college.name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure the visual design, fields, and branding for all student ID cards issued by this college.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowJsonModal(true)}
          >
            View JSON
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Editor & Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Template Editor Controls */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <TemplateEditorForm
            template={template}
            onChange={setTemplate}
            onSave={handleSave}
            onReset={handleReset}
          />
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
                {SAMPLE_STUDENTS.map((st, i) => (
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

            <div className="mt-4 pt-3 border-t text-center">
              <span className="text-[11px] text-gray-400">
                Live Preview updates instantly on every change.
              </span>
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
            This JSON represents the exact <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-700">template_config</code> stored in the database for {college.name}.
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
