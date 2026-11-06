import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ links = [], title = 'Navigation' }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4 px-2">
        {title}
      </div>
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.exact}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {link.icon && <span className="mr-3">{link.icon}</span>}
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
