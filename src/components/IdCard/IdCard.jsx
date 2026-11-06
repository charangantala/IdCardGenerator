import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * IdCard - Pure presentational component that renders an ID card from (student, template) props.
 * Adheres to Section 6 and Section 11 Rules.
 *
 * @param {Object} props
 * @param {Object} props.student - Student data object
 * @param {Object} props.template - JSON template configuration
 */
export default function IdCard({ student = {}, template = {} }) {
  // Safe fallbacks for template
  const layout = template?.layout || 'vertical';
  const colors = {
    primary: template?.colors?.primary || '#1e3a8a',
    secondary: template?.colors?.secondary || '#f59e0b',
    text: template?.colors?.text || '#111827',
    background: template?.colors?.background || '#ffffff',
  };
  const font = template?.font || 'Poppins';
  const logoPosition = template?.logoPosition || 'top-center';
  const photoShape = template?.photoShape || 'circle';
  const showFields = template?.showFields || [
    'name',
    'rollNo',
    'department',
    'year',
    'bloodGroup',
    'phone',
    'validUntil',
  ];
  const fieldLabels = {
    rollNo: 'Roll No',
    department: 'Department',
    year: 'Year',
    bloodGroup: 'Blood Group',
    phone: 'Phone',
    email: 'Email',
    dob: 'Date of Birth',
    validUntil: 'Valid Until',
    ...(template?.fieldLabels || {}),
  };
  const showQR = template?.showQR ?? true;
  const footerText =
    template?.footerText ?? 'If found, please return to the college office.';
  const cornerRadius = template?.cornerRadius !== undefined ? template.cornerRadius : 14;

  // College Logo: support base64, URL from template or student
  const collegeLogo =
    template?.collegeLogo ||
    template?.logo_url ||
    student?.collegeLogo ||
    student?.college_logo ||
    null;

  // Student details normalized
  const name = student?.name || 'STUDENT NAME';
  const rollNo = student?.rollNo || student?.roll_no || 'ROLL NUMBER';
  const department =
    student?.department || student?.department_name || 'DEPARTMENT NAME';
  const rawYear = student?.year || 1;
  const yearSuffix = ['st', 'nd', 'rd', 'th'][Math.min(Number(rawYear) - 1, 3)] || 'th';
  const yearFormatted = `${rawYear}${yearSuffix} Year`;
  const bloodGroup = student?.bloodGroup || student?.blood_group || 'O+';
  const phone = student?.phone || '—';
  const email = student?.email || '—';
  const dob = student?.dob || '—';
  const validUntil = student?.validUntil || student?.valid_until || '2026-06-30';
  const photoUrl = student?.photoUrl || student?.photo_url || '';
  const collegeName =
    template?.collegeName ||
    student?.collegeName ||
    student?.college_name ||
    'COLLEGE / UNIVERSITY NAME';
  const collegeCode =
    template?.collegeCode ||
    student?.collegeCode ||
    student?.college_code ||
    '';
  const cardId = student?.card_id || student?.cardId || student?.id || 'demo-card-id';
  const verifyUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${cardId}`
      : `https://idcard.app/verify/${cardId}`;

  // Photo shape styling
  const photoShapeClass =
    photoShape === 'circle'
      ? 'rounded-full'
      : photoShape === 'rounded'
      ? 'rounded-2xl'
      : 'rounded-none';

  // Dynamic field mapping
  const sectionLabel = student?.section ? ` • Sec ${student.section}` : '';
  const fieldMap = {
    rollNo: { label: fieldLabels.rollNo, value: rollNo },
    department: { label: fieldLabels.department, value: department },
    year: { label: fieldLabels.year, value: `${yearFormatted}${sectionLabel}` },
    bloodGroup: { label: fieldLabels.bloodGroup, value: bloodGroup },
    phone: { label: fieldLabels.phone, value: phone },
    email: { label: fieldLabels.email, value: email },
    dob: { label: fieldLabels.dob, value: dob },
    validUntil: { label: fieldLabels.validUntil, value: validUntil },
  };

  const visibleMetadataFields = showFields.filter(
    (field) => field !== 'name' && fieldMap[field]
  );

  // Logo position classes
  const getHeaderAlignment = () => {
    if (logoPosition === 'top-left') return 'flex-row items-center justify-start text-left';
    if (logoPosition === 'top-right') return 'flex-row-reverse items-center justify-start text-right';
    return 'flex-col items-center justify-center text-center';
  };

  // Common Header component for both layouts
  const HeaderBanner = () => (
    <div
      className="px-4 py-3 relative overflow-hidden transition-colors"
      style={{
        backgroundColor: colors.primary,
        color: '#ffffff',
      }}
    >
      {/* Decorative accent bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: colors.secondary }}
      />
      <div className={`flex gap-2.5 ${getHeaderAlignment()}`}>
        {/* College Logo Image OR Fallback Monogram */}
        {collegeLogo ? (
          <div className="w-11 h-11 flex-shrink-0 rounded-xl overflow-hidden bg-white/95 p-1 flex items-center justify-center shadow-md border-2 border-white/40">
            <img
              src={collegeLogo}
              alt={collegeName}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-xs uppercase shadow-sm border border-white/20"
            style={{
              backgroundColor: colors.secondary,
              color: '#ffffff',
            }}
          >
            {collegeCode || 'COL'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider leading-tight truncate">
            {collegeName}
          </h2>
          <span className="text-[10px] opacity-90 tracking-widest uppercase font-medium block">
            Student Identity Card
          </span>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // 1. VERTICAL (PORTRAIT) LAYOUT
  // ==========================================
  if (layout === 'vertical') {
    return (
      <div
        id={`card-${cardId}`}
        className="id-card-container relative overflow-hidden shadow-xl border border-gray-200 transition-all select-none flex flex-col justify-between"
        style={{
          width: '320px',
          minHeight: '504px',
          borderRadius: `${cornerRadius}px`,
          backgroundColor: colors.background,
          fontFamily: `'${font}', sans-serif`,
          color: colors.text,
        }}
      >
        {/* Top Header */}
        <HeaderBanner />

        {/* Card Body */}
        <div className="px-5 py-4 flex-1 flex flex-col items-center text-center">
          {/* Photo Container */}
          <div className="relative mb-3 group">
            <div
              className={`w-24 h-28 overflow-hidden border-3 shadow-md flex items-center justify-center bg-gray-100 ${photoShapeClass}`}
              style={{
                borderColor: colors.secondary,
                borderWidth: '3px',
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                  <svg
                    className="w-10 h-10 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span className="text-[9px] uppercase font-semibold text-gray-400 mt-1">
                    Photo
                  </span>
                </div>
              )}
            </div>

            {/* Blood group mini badge attached to photo */}
            {showFields.includes('bloodGroup') && (
              <div
                className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm border border-white"
                style={{ backgroundColor: colors.primary }}
              >
                {bloodGroup}
              </div>
            )}
          </div>

          {/* Student Name */}
          <h3
            className="text-base font-bold uppercase tracking-tight leading-tight mt-1 mb-0.5 text-center"
            style={{ color: colors.primary }}
          >
            {name}
          </h3>

          {/* Department subtitle */}
          {showFields.includes('department') && (
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-3 max-w-[260px] truncate">
              {department}
            </p>
          )}

          {/* Key-Value Details Grid */}
          <div className="w-full bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 space-y-1.5 text-left text-xs mb-3">
            {visibleMetadataFields.map((fieldKey) => {
              if (fieldKey === 'department') return null;
              const item = fieldMap[fieldKey];
              if (!item) return null;
              return (
                <div
                  key={fieldKey}
                  className="flex justify-between items-center py-0.5 border-b border-gray-100 last:border-b-0"
                >
                  <span className="text-[10px] font-medium uppercase text-gray-500 tracking-wider">
                    {item.label}:
                  </span>
                  <span className="text-[11px] font-bold text-gray-800 text-right truncate max-w-[170px]">
                    {item.value}
                  </span>
                </div>
              );
            })}
          </div>

          {/* QR Code and Verification Row */}
          {showQR && (
            <div className="flex items-center justify-center space-x-3 mt-auto pt-1 pb-1">
              <div className="p-1 bg-white rounded-md border border-gray-200 shadow-xs">
                <QRCodeSVG
                  value={verifyUrl}
                  size={46}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">
                  Scan to Verify
                </p>
                <p className="text-[8px] font-mono text-gray-400">
                  ID: {cardId.substring(0, 10)}...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {footerText && (
          <div
            className="px-3 py-1.5 text-center text-[9px] font-medium tracking-tight border-t"
            style={{
              backgroundColor: colors.primary,
              borderColor: colors.secondary,
              color: '#ffffff',
            }}
          >
            {footerText}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. HORIZONTAL (LANDSCAPE) LAYOUT
  // ==========================================
  return (
    <div
      id={`card-${cardId}`}
      className="id-card-container relative overflow-hidden shadow-xl border border-gray-200 transition-all select-none flex flex-col justify-between"
      style={{
        width: '500px',
        minHeight: '316px',
        borderRadius: `${cornerRadius}px`,
        backgroundColor: colors.background,
        fontFamily: `'${font}', sans-serif`,
        color: colors.text,
      }}
    >
      {/* Top Header */}
      <HeaderBanner />

      {/* Card Body - 2 Columns */}
      <div className="px-5 py-3 flex-1 flex items-center gap-5">
        {/* Left Column: Photo & Blood */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div
            className={`w-24 h-28 overflow-hidden border-3 shadow-md flex items-center justify-center bg-gray-100 ${photoShapeClass}`}
            style={{
              borderColor: colors.secondary,
              borderWidth: '3px',
            }}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                <svg
                  className="w-10 h-10 text-gray-300"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-[9px] uppercase font-semibold text-gray-400 mt-1">
                  Photo
                </span>
              </div>
            )}
          </div>

          {showFields.includes('bloodGroup') && (
            <div
              className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
              style={{ backgroundColor: colors.primary }}
            >
              Blood: {bloodGroup}
            </div>
          )}
        </div>

        {/* Center / Right Column: Student Info & Fields */}
        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
          <div>
            <h3
              className="text-lg font-bold uppercase tracking-tight leading-tight truncate"
              style={{ color: colors.primary }}
            >
              {name}
            </h3>
            {showFields.includes('department') && (
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate mb-2">
                {department}
              </p>
            )}

            {/* Field Details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
              {visibleMetadataFields.map((fieldKey) => {
                if (fieldKey === 'department' || fieldKey === 'bloodGroup') return null;
                const item = fieldMap[fieldKey];
                if (!item) return null;
                return (
                  <div key={fieldKey} className="min-w-0">
                    <span className="text-[9px] font-medium uppercase text-gray-400 block tracking-wider">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-bold text-gray-800 truncate block">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Code inside horizontal card */}
          {showQR && (
            <div className="flex items-center space-x-3 mt-2 pt-2 border-t border-gray-100">
              <div className="p-1 bg-white rounded border border-gray-200">
                <QRCodeSVG
                  value={verifyUrl}
                  size={36}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase text-gray-500 block">
                  Scan to Verify
                </span>
                <span className="text-[8px] font-mono text-gray-400 block">
                  Token: {cardId.substring(0, 12)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {footerText && (
        <div
          className="px-4 py-1 text-center text-[9px] font-medium tracking-tight border-t"
          style={{
            backgroundColor: colors.primary,
            borderColor: colors.secondary,
            color: '#ffffff',
          }}
        >
          {footerText}
        </div>
      )}
    </div>
  );
}
