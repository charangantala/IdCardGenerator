import React from 'react';

export default function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error = '',
  required = false,
  helperText = '',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white disabled:bg-gray-100 disabled:text-gray-500 ${
          error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300'
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
