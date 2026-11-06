import React, { useRef } from 'react';
import Button from '../common/Button';

// Sample pre-designed SVG logos for 1-click test branding
const PRESET_LOGOS = [
  {
    name: 'Academic Shield Crest',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 5 L85 20 L85 55 C85 75 50 95 50 95 C50 95 15 75 15 55 L15 20 Z' fill='%231e3a8a' stroke='%23f59e0b' stroke-width='4'/><path d='M50 25 L65 40 L35 40 Z' fill='%23f59e0b'/><circle cx='50' cy='60' r='10' fill='%23ffffff'/></svg>",
  },
  {
    name: 'Tech Emblem / Compass',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%23065f46' stroke='%2310b981' stroke-width='4'/><polygon points='50,15 60,40 85,50 60,60 50,85 40,60 15,50 40,40' fill='%23fbbf24'/><circle cx='50' cy='50' r='6' fill='%23ffffff'/></svg>",
  },
  {
    name: 'Torch of Knowledge',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%23991b1b'/><path d='M50 15 C40 30 60 40 50 55 C40 40 60 30 50 15 Z' fill='%23f59e0b'/><path d='M42 55 L58 55 L54 85 L46 85 Z' fill='%23ffffff'/></svg>",
  },
];

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
  { value: 'top-center', label: 'Top Center (Centered)' },
  { value: 'top-left', label: 'Top Left (Classic Banner)' },
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

export default function TemplateEditorForm({
  template = {},
  onChange,
  onSave,
  onReset,
}) {
  const fileInputRef = useRef(null);

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
  const collegeLogo = template.collegeLogo || template.logo_url || null;
  const collegeName = template.collegeName || 'MIT College of Technology';
  const collegeCode = template.collegeCode || 'MITC';
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
    if (fieldKey === 'name') return;
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

    if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdate({ collegeLogo: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    handleUpdate({ collegeLogo: null });
  };

  return (
    <div className="space-y-6">
      {/* 1. College Logo & Branding Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center space-x-1.5">
              <span>🏛️</span>
              <span>College Logo & Emblem</span>
            </h4>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Upload the institution's official logo or choose a sample crest.
            </p>
          </div>
          {collegeLogo && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold underline"
            >
              Remove Logo ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Logo Preview Box */}
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-blue-300 p-1 flex items-center justify-center shadow-xs flex-shrink-0">
            {collegeLogo ? (
              <img
                src={collegeLogo}
                alt="College Logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <span className="text-xl block">🏫</span>
                <span className="text-[9px] font-bold uppercase">No Logo</span>
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1 min-w-[200px]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
              id="college-logo-upload"
            />
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor="college-logo-upload"
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
              >
                Upload Official Logo 📁
              </label>
            </div>
            <p className="text-[10px] text-gray-500">
              Format: PNG (transparent recommended), JPG, SVG • Auto-scales inside card header
            </p>
          </div>
        </div>

        {/* Quick Sample Logos */}
        <div className="pt-2 border-t border-blue-200/60">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
            Or Test With Sample Emblems:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_LOGOS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleUpdate({ collegeLogo: preset.url })}
                className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-200 rounded-lg text-[11px] font-medium text-gray-700 flex items-center space-x-1.5 shadow-2xs transition-colors"
              >
                <img src={preset.url} alt="" className="w-4 h-4 object-contain" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logo Position */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Logo Header Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LOGO_POSITIONS.map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => handleUpdate({ logoPosition: pos.value })}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                  logoPosition === pos.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. College Institution Name & Code */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            College Name on Card Header
          </label>
          <input
            type="text"
            value={collegeName}
            onChange={(e) => handleUpdate({ collegeName: e.target.value })}
            placeholder="e.g. MIT College of Technology"
            className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold text-gray-800"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Short Code (Monogram Fallback)
          </label>
          <input
            type="text"
            value={collegeCode}
            onChange={(e) => handleUpdate({ collegeCode: e.target.value.toUpperCase() })}
            placeholder="e.g. MITC"
            className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono font-bold text-gray-800"
          />
        </div>
      </div>

      {/* 3. Theme Presets */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <span className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
          Quick Color Palette Presets
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

      {/* 4. Layout & Dimensions */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Layout & Orientation
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

      {/* 5. Color Palette */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Custom Brand Colors
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

      {/* 6. Typography & Photo Shape */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Typography & Photo Shape
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* 7. Visible Fields & Custom Labels */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Visible Fields & On-Card Labels
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

      {/* 8. QR Code & Footer Text */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
          Verification QR & Footer Text
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

      {/* Save Button */}
      <div className="pt-4 border-t flex items-center justify-between">
        {onReset && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset to Defaults
          </Button>
        )}
        {onSave && (
          <Button type="button" variant="primary" size="md" onClick={onSave}>
            Save Template Config 💾
          </Button>
        )}
      </div>
    </div>
  );
}
