import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import PhotoCropperModal from './PhotoCropperModal';
import { BLOOD_GROUPS } from '../../utils/constants';
import { validateStudentField } from '../../utils/validators';

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const DEPARTMENT_OPTIONS = [
  { value: 'Computer Science & Engineering', label: 'Computer Science & Engineering (CSE)' },
  { value: 'Electronics & Communication', label: 'Electronics & Communication (ECE)' },
  { value: 'Mechanical Engineering', label: 'Mechanical Engineering (ME)' },
  { value: 'Information Technology', label: 'Information Technology (IT)' },
  { value: 'Civil Engineering', label: 'Civil Engineering (CE)' },
];

const YEAR_OPTIONS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

const SECTION_OPTIONS = [
  { value: 'A', label: 'Section A' },
  { value: 'B', label: 'Section B' },
  { value: 'C', label: 'Section C' },
  { value: 'D', label: 'Section D' },
];

/**
 * StudentForm - Reusable controlled student details input form.
 * Follows Rule 3: Plain controlled inputs (value + onChange).
 */
export default function StudentForm({
  formData = {},
  onChange,
  onSaveDraft,
  onSubmitApproval,
  isLocked = false,
  errors = {},
  showActions = true,
}) {
  const [cropperModalOpen, setCropperModalOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);
  const [photoError, setPhotoError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (onChange) {
      onChange(name, value);
    }
  };

  // Handle Photo selection from disk
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');

    // Max 2MB rule from Section 9
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Photo size must not exceed 2 MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Photo must be JPG, PNG, or WebP');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result);
      setCropperModalOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be picked again if desired
    e.target.value = '';
  };

  const handleCroppedPhoto = (croppedDataUrl) => {
    if (onChange) {
      onChange('photoUrl', croppedDataUrl);
      onChange('photo_url', croppedDataUrl);
    }
  };

  return (
    <div className="space-y-6">
      {isLocked && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
          <span>🔒</span>
          <span>
            <strong>Form is locked:</strong> Your ID card is currently submitted or approved. You cannot make edits unless rejected by the college.
          </span>
        </div>
      )}

      {/* Photo Upload Section */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
          Student Passport Photo (3:4 Ratio) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-4">
          {/* Photo Thumbnail */}
          <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-gray-300 bg-white flex items-center justify-center flex-shrink-0 shadow-xs">
            {formData.photoUrl || formData.photo_url ? (
              <img
                src={formData.photoUrl || formData.photo_url}
                alt="Student preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2 text-gray-400">
                <svg className="w-8 h-8 mx-auto text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-[9px] font-semibold block mt-1">No Photo</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <label
                htmlFor="student-photo-input"
                className={`inline-block px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg shadow-xs hover:bg-gray-50 cursor-pointer transition-colors ${
                  isLocked ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Upload & Crop Photo
              </label>
              <input
                id="student-photo-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={isLocked}
                onChange={handlePhotoSelect}
              />
            </div>
            <p className="text-[11px] text-gray-500">
              Format: JPG, PNG • Max size: 2 MB • Auto-crops to 3:4 passport ratio
            </p>
            {photoError && <p className="text-xs text-red-600 font-medium">{photoError}</p>}
          </div>
        </div>
      </div>

      {/* Section 1: Academic & Identification Info */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Academic Credentials
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            id="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="e.g. Alex Morgan"
            required
            error={errors.name}
            disabled={isLocked}
          />

          <Input
            label="Roll Number / Student ID"
            id="rollNo"
            value={formData.rollNo || formData.roll_no || ''}
            onChange={handleChange}
            placeholder="e.g. MITC-2023-CS-042"
            required
            error={errors.rollNo}
            disabled={isLocked}
          />

          <Select
            label="Department"
            id="department"
            value={formData.department || formData.department_name || ''}
            onChange={handleChange}
            options={DEPARTMENT_OPTIONS}
            placeholder="Select Department"
            required
            error={errors.department}
            disabled={isLocked}
          />

          <Select
            label="Academic Year"
            id="year"
            value={formData.year || 1}
            onChange={handleChange}
            options={YEAR_OPTIONS}
            required
            error={errors.year}
            disabled={isLocked}
          />

          <Select
            label="Class Section"
            id="section"
            value={formData.section || 'A'}
            onChange={handleChange}
            options={SECTION_OPTIONS}
            required
            error={errors.section}
            disabled={isLocked}
          />
        </div>
      </div>

      {/* Section 2: Personal Details */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date of Birth"
            id="dob"
            type="date"
            value={formData.dob || ''}
            onChange={handleChange}
            error={errors.dob}
            disabled={isLocked}
          />

          <Select
            label="Gender"
            id="gender"
            value={formData.gender || 'Male'}
            onChange={handleChange}
            options={GENDER_OPTIONS}
            disabled={isLocked}
          />

          <Select
            label="Blood Group"
            id="bloodGroup"
            value={formData.bloodGroup || formData.blood_group || 'O+'}
            onChange={handleChange}
            options={BLOOD_GROUPS}
            error={errors.bloodGroup}
            disabled={isLocked}
          />
        </div>
      </div>

      {/* Section 3: Contact & Emergency */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Contact Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={handleChange}
            placeholder="10-digit mobile number"
            error={errors.phone}
            disabled={isLocked}
          />

          <Input
            label="Email Address"
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            placeholder="student@college.edu"
            error={errors.email}
            disabled={isLocked}
          />

          <Input
            label="Guardian / Parent Name"
            id="guardian_name"
            value={formData.guardian_name || ''}
            onChange={handleChange}
            placeholder="Full Name of Guardian"
            disabled={isLocked}
          />

          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Residential Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={2}
              value={formData.address || ''}
              onChange={handleChange}
              disabled={isLocked}
              placeholder="Permanent or hostel address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Form Action Buttons */}
      {showActions && (
        <div className="pt-4 border-t flex flex-wrap gap-3 items-center justify-end">
          {onSaveDraft && (
            <Button
              type="button"
              variant="secondary"
              onClick={onSaveDraft}
              disabled={isLocked}
            >
              Save Draft
            </Button>
          )}
          {onSubmitApproval && (
            <Button
              type="button"
              variant="primary"
              onClick={onSubmitApproval}
              disabled={isLocked}
            >
              Submit for Approval
            </Button>
          )}
        </div>
      )}

      {/* Crop Modal */}
      <PhotoCropperModal
        isOpen={cropperModalOpen}
        onClose={() => setCropperModalOpen(false)}
        imageSrc={tempImageSrc}
        onCropComplete={handleCroppedPhoto}
      />
    </div>
  );
}
