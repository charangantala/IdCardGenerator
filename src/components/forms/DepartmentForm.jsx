import React, { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

export default function DepartmentForm({
  initialData = {},
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialData.name || '');
  const [code, setCode] = useState(initialData.code || '');
  const [years, setYears] = useState(initialData.years || 4);
  const [description, setDescription] = useState(initialData.description || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Department name is required');
      return;
    }
    if (!code.trim()) {
      setError('Department code is required');
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...initialData,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        years: Number(years),
        description: description.trim(),
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
        label="Department Name"
        id="dept-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Computer Science & Engineering"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Short Code"
          id="dept-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CSE"
          required
        />

        <Select
          label="Degree Duration (Years)"
          id="dept-years"
          value={years}
          onChange={(e) => setYears(Number(e.target.value))}
          options={[
            { value: 1, label: '1 Year' },
            { value: 2, label: '2 Years' },
            { value: 3, label: '3 Years' },
            { value: 4, label: '4 Years' },
            { value: 5, label: '5 Years' },
          ]}
          required
        />
      </div>

      <div>
        <label htmlFor="dept-desc" className="block text-sm font-medium text-gray-700 mb-1">
          Brief Description
        </label>
        <textarea
          id="dept-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes or program description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-3 border-t">
        {onCancel && (
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" size="sm" type="submit">
          {initialData.id ? 'Save Changes' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
}
