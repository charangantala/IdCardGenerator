import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

export default function CollegeForm({
  initialData = {},
  onSubmit,
  onCancel,
}) {
  const isEditing = !!initialData.id;

  const [name, setName] = useState(initialData.name || '');
  const [code, setCode] = useState(initialData.code || '');
  const [studentLimit, setStudentLimit] = useState(initialData.student_limit || initialData.studentLimit || 1000);
  const [validUntil, setValidUntil] = useState(initialData.valid_until || initialData.validUntil || '2027-12-31');
  const [status, setStatus] = useState(initialData.status || 'active');
  
  // Section 8.2: "Add college also creates the college's first login"
  const [adminEmail, setAdminEmail] = useState(initialData.adminEmail || '');
  const [adminPassword, setAdminPassword] = useState(initialData.adminPassword || 'College@123');

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('College name is required');
      return;
    }
    if (!code.trim()) {
      setError('College code is required');
      return;
    }
    if (!isEditing && !adminEmail.trim()) {
      setError('Initial college login email is required');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...initialData,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        studentLimit: Number(studentLimit),
        student_limit: Number(studentLimit),
        validUntil,
        valid_until: validUntil,
        status,
        adminEmail: adminEmail.trim(),
        adminPassword,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <Input
        label="College Name"
        id="college-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. MIT College of Technology"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="College Code (Unique)"
          id="college-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. MITC"
          required
        />

        <Input
          label="Student License Limit"
          id="college-limit"
          type="number"
          value={studentLimit}
          onChange={(e) => setStudentLimit(Number(e.target.value))}
          placeholder="e.g. 1500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Subscription Valid Until"
          id="college-valid"
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          required
        />

        <div>
          <label htmlFor="college-status" className="block text-sm font-medium text-gray-700 mb-1">
            Account Status
          </label>
          <select
            id="college-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="active">Active (Operational)</option>
            <option value="suspended">Suspended (Login Blocked)</option>
          </select>
        </div>
      </div>

      {/* Primary Login Credentials (when creating new college) */}
      {!isEditing && (
        <div className="pt-3 border-t space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Initial College Login Credentials
          </h4>
          <p className="text-[11px] text-gray-500">
            These credentials allow the college registrar to log into their dashboard.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Registrar Email"
              id="admin-email"
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="registrar@college.edu"
              required
            />
            <Input
              label="Temporary Password"
              id="admin-password"
              type="text"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-3 border-t">
        {onCancel && (
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" size="sm" type="submit">
          {isEditing ? 'Save Changes' : 'Create College'}
        </Button>
      </div>
    </form>
  );
}
