import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
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
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500 ${
          error ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300'
        }`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}
