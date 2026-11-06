import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { DEFAULT_FACULTY_ADVISORS } from '../../utils/sectionData';

/**
 * SectionFilter - Renders section division tabs and the assigned Section Faculty Advisor banner.
 * Manages faculty assignment and section switching.
 */
export default function SectionFilter({
  sections = [],
  selectedSection = 'all',
  onSelectSection,
  studentCountsBySection = {},
  activeFaculty = null,
  onUpdateSectionFaculty,
  onAddSection,
  selectedYear = 'all',
  departmentName = 'Department',
}) {
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);

  // Reassign form state
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [customFacultyName, setCustomFacultyName] = useState('');
  const [customFacultyEmail, setCustomFacultyEmail] = useState('');
  const [customFacultyDesignation, setCustomFacultyDesignation] = useState('');
  const [isCustomFaculty, setIsCustomFaculty] = useState(false);

  // New section form state
  const [newSectionCode, setNewSectionCode] = useState('');
  const [newSectionFacultyId, setNewSectionFacultyId] = useState(DEFAULT_FACULTY_ADVISORS[0]?.id || '');

  // Active section object if specific section is selected
  const activeSectionObj = sections.find(
    (s) => s.code?.toUpperCase() === String(selectedSection).toUpperCase()
  );

  const handleOpenReassignModal = () => {
    if (activeFaculty) {
      setSelectedFacultyId(activeFaculty.id || DEFAULT_FACULTY_ADVISORS[0]?.id);
      setCustomFacultyName(activeFaculty.name || '');
      setCustomFacultyEmail(activeFaculty.email || '');
      setCustomFacultyDesignation(activeFaculty.designation || '');
    }
    setIsCustomFaculty(false);
    setReassignModalOpen(true);
  };

  const handleSaveReassign = () => {
    let facultyData;
    if (isCustomFaculty) {
      if (!customFacultyName.trim()) return;
      facultyData = {
        faculty_id: `fac-custom-${Date.now()}`,
        faculty_name: customFacultyName.trim(),
        faculty_email: customFacultyEmail.trim() || 'advisor@mitc.edu',
        faculty_designation: customFacultyDesignation.trim() || 'Section In-Charge',
      };
    } else {
      const chosen = DEFAULT_FACULTY_ADVISORS.find((f) => f.id === selectedFacultyId) || DEFAULT_FACULTY_ADVISORS[0];
      facultyData = {
        faculty_id: chosen.id,
        faculty_name: chosen.name,
        faculty_email: chosen.email,
        faculty_designation: chosen.designation,
        faculty_phone: chosen.phone,
      };
    }

    if (onUpdateSectionFaculty && activeSectionObj) {
      onUpdateSectionFaculty(activeSectionObj.id, facultyData);
    }
    setReassignModalOpen(false);
  };

  const handleSaveNewSection = () => {
    if (!newSectionCode.trim()) return;
    const cleanCode = newSectionCode.trim().toUpperCase().charAt(0);
    const chosenFaculty =
      DEFAULT_FACULTY_ADVISORS.find((f) => f.id === newSectionFacultyId) ||
      DEFAULT_FACULTY_ADVISORS[0];

    if (onAddSection) {
      onAddSection({
        code: cleanCode,
        name: `Section ${cleanCode}`,
        faculty_id: chosenFaculty.id,
        faculty_name: chosenFaculty.name,
        faculty_email: chosenFaculty.email,
        faculty_designation: chosenFaculty.designation,
      });
    }
    setNewSectionCode('');
    setAddSectionModalOpen(false);
    onSelectSection && onSelectSection(cleanCode);
  };

  // Build tabs: 'all' + sections available for this year
  const sectionTabs = [
    { code: 'all', name: 'All Sections' },
    ...sections.map((s) => ({
      code: s.code,
      name: s.name || `Section ${s.code}`,
      faculty_name: s.faculty_name,
    })),
  ];

  const totalCohortCount = Object.values(studentCountsBySection).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 pt-1">
      {/* 1. Sub-navigation: Section Tabs & New Section Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
            Section:
          </span>
          {sectionTabs.map((tab) => {
            const isSelected = String(selectedSection).toUpperCase() === String(tab.code).toUpperCase();
            const count =
              tab.code === 'all'
                ? totalCohortCount
                : studentCountsBySection[tab.code] || 0;

            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => onSelectSection && onSelectSection(tab.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Add Section Button */}
          {selectedYear !== 'all' && (
            <button
              type="button"
              onClick={() => setAddSectionModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 transition-colors"
              title="Add a new section to this academic year"
            >
              + Add Section
            </button>
          )}
        </div>

        {/* Small context indicator */}
        <div className="text-[11px] text-gray-500 hidden sm:block">
          {selectedYear !== 'all' ? `Year ${selectedYear}` : 'All Years'} • {departmentName}
        </div>
      </div>

      {/* 2. Faculty In-Charge Accountability Spotlight Banner */}
      {selectedSection !== 'all' && activeFaculty && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-xl p-4 shadow-2xs transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              {/* Faculty Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-white shadow-xs overflow-hidden flex items-center justify-center flex-shrink-0">
                  {activeFaculty.avatar ? (
                    <img
                      src={activeFaculty.avatar}
                      alt={activeFaculty.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-bold text-blue-700">
                      {activeFaculty.name?.charAt(0) || 'F'}
                    </span>
                  )}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                  title="Designated Card Approver"
                >
                  ✓
                </span>
              </div>

              {/* Faculty Details */}
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-gray-900">{activeFaculty.name}</h4>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Section {selectedSection} In-Charge
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {activeFaculty.designation || 'Faculty Advisor & ID Card Approver'}
                </p>
                <div className="flex items-center space-x-3 text-[11px] text-gray-500 mt-1">
                  <span>✉️ {activeFaculty.email}</span>
                  {activeFaculty.phone && <span>📞 {activeFaculty.phone}</span>}
                  <span className="text-emerald-700 font-medium">
                    🛡️ Authorized Section Approver
                  </span>
                </div>
              </div>
            </div>

            {/* Reassign Faculty Action */}
            <div className="flex items-center space-x-2 self-end sm:self-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleOpenReassignModal}
                title="Change or reassign the faculty in-charge for this section"
              >
                ✏️ Reassign Advisor
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Reassign Faculty Advisor */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={`Reassign In-Charge for Section ${selectedSection}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Select the designated faculty advisor responsible for reviewing and approving student ID
            cards in <strong>Section {selectedSection}</strong>.
          </p>

          <div className="flex items-center space-x-4 border-b pb-3 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer font-medium text-gray-700">
              <input
                type="radio"
                checked={!isCustomFaculty}
                onChange={() => setIsCustomFaculty(false)}
                className="text-blue-600"
              />
              <span>Select from College Faculty</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer font-medium text-gray-700">
              <input
                type="radio"
                checked={isCustomFaculty}
                onChange={() => setIsCustomFaculty(true)}
                className="text-blue-600"
              />
              <span>Enter New Faculty</span>
            </label>
          </div>

          {!isCustomFaculty ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700">
                Choose Faculty Member
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {DEFAULT_FACULTY_ADVISORS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.designation}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="Faculty Full Name"
                id="customFacultyName"
                value={customFacultyName}
                onChange={(e) => setCustomFacultyName(e.target.value)}
                placeholder="e.g. Dr. Ada Lovelace"
                required
              />
              <Input
                label="Designation / Role"
                id="customFacultyDesignation"
                value={customFacultyDesignation}
                onChange={(e) => setCustomFacultyDesignation(e.target.value)}
                placeholder="e.g. Associate Professor & Section In-Charge"
              />
              <Input
                label="Official Email"
                id="customFacultyEmail"
                type="email"
                value={customFacultyEmail}
                onChange={(e) => setCustomFacultyEmail(e.target.value)}
                placeholder="e.g. ada.lovelace@mitc.edu"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReassignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveReassign}
            >
              Save Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Modal: Add New Section */}
      <Modal
        isOpen={addSectionModalOpen}
        onClose={() => setAddSectionModalOpen(false)}
        title={`Add New Section (Year ${selectedYear})`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">
            Create an additional student section for this class year and assign a faculty advisor
            responsible for ID card approvals.
          </p>

          <Input
            label="Section Code (e.g. C, D, E)"
            id="newSectionCode"
            value={newSectionCode}
            onChange={(e) => setNewSectionCode(e.target.value.toUpperCase())}
            placeholder="C"
            maxLength={2}
            required
          />

          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              Assigned Faculty In-Charge
            </label>
            <select
              value={newSectionFacultyId}
              onChange={(e) => setNewSectionFacultyId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {DEFAULT_FACULTY_ADVISORS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.designation})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddSectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNewSection}
              disabled={!newSectionCode.trim()}
            >
              Create Section
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

