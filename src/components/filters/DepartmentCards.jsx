import React from 'react';
import Button from '../common/Button';

export default function DepartmentCards({
  departments = [],
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
  studentCounts = {},
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-gray-900">Academic Departments</h3>
          <p className="text-xs text-gray-500">
            Select a department to manage its students, or add new academic departments.
          </p>
        </div>
        {onAddNew && (
          <Button variant="primary" size="sm" onClick={onAddNew}>
            + Add Department
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map((dept) => {
          const isSelected = selectedId === dept.id;
          const count = studentCounts[dept.id] || 0;

          return (
            <div
              key={dept.id}
              onClick={() => onSelect && onSelect(dept.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {dept.code || 'DEPT'}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {dept.years} Years
                  </span>
                </div>

                <h4 className="font-bold text-gray-900 text-sm leading-snug mb-1">
                  {dept.name}
                </h4>
                {dept.description && (
                  <p className="text-[11px] text-gray-500 line-clamp-2">
                    {dept.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600">
                  {count} {count === 1 ? 'Student' : 'Students'}
                </span>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(dept)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit Department"
                    >
                      ✏️
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(dept)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete Department"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
