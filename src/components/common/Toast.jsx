import React from 'react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const bgColors = {
    info: 'bg-blue-600',
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    warning: 'bg-amber-600',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center shadow-lg rounded-lg overflow-hidden text-white transition-transform">
      <div className={`px-4 py-3 flex items-center space-x-3 ${bgColors[type] || bgColors.info}`}>
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-sm font-bold ml-3"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
