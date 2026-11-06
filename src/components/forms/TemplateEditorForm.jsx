import React from 'react';
import Button from '../common/Button';

const AVAILABLE_FONTS = [
  { value: 'Poppins', label: 'Poppins (Geometric & Modern)' },
  { value: 'Inter', label: 'Inter (Clean & Professional)' },
  { value: 'Montserrat', label: 'Montserrat (Bold & Elegant)' },
  { value: 'Roboto', label: 'Roboto (Standard Sans)' },
  { value: 'Open Sans', label: 'Open Sans (Neutral & Legible)' },
];

const PHOTO_SHAPES = [
  { value: 'circle', label: 'Circle (Passport Standard)' },
  { value: 'rounded', label: 'Rounded Rectangle' },
  { value: 'square', label: 'Square (Sharp Corners)' },
];

const LOGO_POSITIONS = [
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
];

const ALL_FIELDS = [
  { key: 'name', defaultLabel: 'Full Name', alwaysOn: true },
  { key: 'rollNo', defaultLabel: 'Roll No / ID' },
  { key: 'department', defaultLabel: 'Department' },
  { key: 'year', defaultLabel: 'Academic Year' },
  { key: 'bloodGroup', defaultLabel: 'Blood Group' },
  { key: 'phone', defaultLabel: 'Phone Number' },
  { key: 'email', defaultLabel: 'Email' },
  { key: 'dob', defaultLabel: 'Date of Birth' },
  { key: 'validUntil', defaultLabel: 'Valid Until' },
];

const THEME_PRESETS = [
  {
    name: 'Classic Navy',
    colors: { primary: '#1e3a8a', secondary: '#f59e0b', text: '#111827', background: '#ffffff' },
    font: 'Poppins',
    photoShape: 'circle',
  },
  {
    name: 'Forest Emerald',
    colors: { primary: '#065f46', secondary: '#10b981', text: '#0f172a', background: '#f8fafc' },
    font: 'Montserrat',
    photoShape: 'rounded',
  },
  {
    name: 'Crimson Tech',
    colors: { primary: '#991b1b', secondary: '#dc2626', text: '#18181b', background: '#fafafa' },
    font: 'Inter',
    photoShape: 'square',
  },
  {
    name: 'Royal Purple',
    colors: { primary: '#581c87', secondary: '#a855f7', text: '#1e1b4b', background: '#ffffff' },
    font: 'Roboto',
    photoShape: 'rounded',
  },
];

/**
 * TemplateEditorForm - Form controls for configuring the JSON card template.
 * Meets Section 6 requirements.
 */
export default function TemplateEditorForm({
  template = {},
  onChange,
  onSave,
  onReset,
}) {
  const layout = template.layout || 'vertical';
  const colors = template.colors || {
    primary: '#1e3a8a',
    secondary: '#f59e0b',
    text: '#111827',
    background: '#ffffff',
  };
  const font = template.font || 'Poppins';
  const photoShape = template.photoShape || 'circle';
  const logoPosition = template.logoPosition || 'top-center';
  const showFields = template.showFields || ['name', 'rollNo', 'department', 'year', 'bloodGroup', 'phone', 'validUntil'];
  const fieldLabels = template.fieldLabels || {};
  const showQR = template.showQR ?? true;
  const footerText = template.footerText ?? 'If found, please return to the college office.';
  const cornerRadius = template.cornerRadius ?? 14;

  const handleUpdate = (updates) => {
    if (onChange) {
      onChange({ ...template, ...updates });
    }
  };

  const handleColorChange = (key, value) => {
    handleUpdate({
      colors: {
        ...colors,
        [key]: value,
      },
    });
  };

  const handleFieldToggle = (fieldKey) => {
    if (fieldKey === 'name') return; // name is always required
    const isChecked = showFields.includes(fieldKey);
    const updated = isChecked
      ? showFields.filter((f) => f !== fieldKey)
      : [...showFields, fieldKey];
    handleUpdate({ showFields: updated });
  };

  const handleLabelChange = (fieldKey, newLabel) => {
    handleUpdate({
      fieldLabels: {
        ...fieldLabels,
        [fieldKey]: newLabel,
      },
    });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate({ collegeLogo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Theme Presets */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <span className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
          Color Presets
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() =>
                handleUpdate({
                  colors: preset.colors,
                  font: preset.font,
                  photoShape: preset.photoShape,
                })
              }
              className="p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-500 text-left transition-all shadow-xs"
            >
              <div className="flex items-center space-x-1.5 mb-1.5">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: preset.colors.secondary }}
                />
              </div>
              <p className="text-xs font-bold text-gray-800 truncate">{preset.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Layout & Dimensions */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          1. Layout & Card Orientation
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Orientation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdate({ layout: 'vertical' })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  layout === 'vertical'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Vertical (Portrait)
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ layout: 'horizontal' })}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all ${
                  layout === 'horizontal'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Horizontal (Landscape)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Corner Radius: <span className="font-bold text-blue-600">{cornerRadius}px</span>
            </label>
            <input
              type="range"
              min="0"
              max="24"
              value={cornerRadius}
              onChange={(e) => handleUpdate({ cornerRadius: Number(e.target.value) })}
              className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer mt-2"
            />
          </div>
        </div>
      </div>

      {/* 2. Color Palette */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          2. Color Scheme
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Primary Brand
            </label>
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-gray-300">
              <input
                type="color"
                value={colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer p-0"
              />
              <span className="text-[11px] font-mono text-gray-700 uppercase">
                {colors.primary}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Secondary Accent
            </label>
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-gray-300">
              <input
                type="color"
                value={colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer p-0"
              />
              <span className="text-[11px] font-mono text-gray-700 uppercase">
                {colors.secondary}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-gray-300">
              <input
                type="color"
                value={colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer p-0"
              />
              <span className="text-[11px] font-mono text-gray-700 uppercase">
                {colors.text}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Card Background
            </label>
            <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-gray-300">
              <input
                type="color"
                value={colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer p-0"
              />
              <span className="text-[11px] font-mono text-gray-700 uppercase">
                {colors.background}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Typography, Photo Shape & Logo Position */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          3. Styling & Branding
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Typography Font
            </label>
            <select
              value={font}
              onChange={(e) => handleUpdate({ font: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_FONTS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Photo Shape
            </label>
            <select
              value={photoShape}
              onChange={(e) => handleUpdate({ photoShape: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
            >
              {PHOTO_SHAPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Logo Position
            </label>
            <select
              value={logoPosition}
              onChange={(e) => handleUpdate({ logoPosition: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500"
            >
              {LOGO_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Visible Fields & Custom Labels */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          4. Visible Card Fields & Custom Labels
        </h4>
        <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="grid grid-cols-12 text-[11px] font-bold text-gray-500 uppercase tracking-wider pb-1 border-b">
            <span className="col-span-5">Field</span>
            <span className="col-span-7">Display Label On Card</span>
          </div>

          {ALL_FIELDS.map((f) => {
            const isVisible = showFields.includes(f.key);
            const currentLabel = fieldLabels[f.key] !== undefined ? fieldLabels[f.key] : f.defaultLabel;

            return (
              <div key={f.key} className="grid grid-cols-12 items-center gap-2 py-1">
                <div className="col-span-5 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`field-${f.key}`}
                    checked={isVisible}
                    disabled={f.alwaysOn}
                    onChange={() => handleFieldToggle(f.key)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-60"
                  />
                  <label
                    htmlFor={`field-${f.key}`}
                    className={`text-xs font-medium ${
                      f.alwaysOn ? 'text-gray-900 font-bold' : 'text-gray-700'
                    }`}
                  >
                    {f.defaultLabel} {f.alwaysOn && <span className="text-[10px] text-gray-400 font-normal">(always on)</span>}
                  </label>
                </div>

                <div className="col-span-7">
                  <input
                    type="text"
                    value={currentLabel}
                    disabled={!isVisible}
                    onChange={(e) => handleLabelChange(f.key, e.target.value)}
                    placeholder={f.defaultLabel}
                    className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. QR Code & Footer Text */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          5. Verification QR & Footer Text
        </h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-xl">
            <input
              type="checkbox"
              id="show-qr-toggle"
              checked={showQR}
              onChange={(e) => handleUpdate({ showQR: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="show-qr-toggle" className="text-xs font-semibold text-gray-800 cursor-pointer">
              Display Verification QR Code on Card (links to public verification page)
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Card Disclaimer / Footer Text
            </label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => handleUpdate({ footerText: e.target.value })}
              placeholder="e.g. If found, please return to the college admin office."
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t flex items-center justify-between">
        {onReset && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset to Defaults
          </Button>
        )}
        {onSave && (
          <Button type="button" variant="primary" size="md" onClick={onSave}>
            Save Template Config
          </Button>
        )}
      </div>
    </div>
  );
}
