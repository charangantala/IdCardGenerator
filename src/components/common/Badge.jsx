import React from 'react';

export default function Badge({ children, variant = 'gray', size = 'sm' }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-800',
    yellow: 'bg-amber-100 text-amber-800',
    red: 'bg-rose-100 text-rose-800',
    purple: 'bg-purple-100 text-purple-800',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${
        variants[variant] || variants.gray
      } ${sizes[size] || sizes.sm}`}
    >
      {children}
    </span>
  );
}
