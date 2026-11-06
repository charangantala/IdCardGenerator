import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge';

export default function CollegeTable({
  colleges = [],
  loading = false,
  error = null,
  onEdit,
  onToggleStatus,
  onDelete,
  onAddNew,
  studentCounts = {},
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b last:border-b-0">
            <div className="flex items-center space-x-3 w-1/3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center text-rose-700">
        <p className="font-bold text-sm">Error Loading Colleges</p>
        <p className="text-xs text-rose-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!colleges || colleges.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center text-xl mb-3">
          🏛️
        </div>
        <h4 className="font-bold text-gray-800 text-sm">No Colleges Registered</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Add your first partner college to issue and configure digital student ID cards.
        </p>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs"
          >
            + Add College
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
            <tr>
              <th className="py-3.5 px-4">College</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Students / Capacity</th>
              <th className="py-3.5 px-4">Valid Until</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {colleges.map((col) => {
              const enrolled = studentCounts[col.id] || col.studentCount || 0;
              const limit = col.studentLimit || col.student_limit || 1000;
              const percentUsed = Math.min(Math.round((enrolled / limit) * 100), 100);
              const isSuspended = col.status === 'suspended';

              return (
                <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Name and Code */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-xs shadow-xs border border-blue-200 flex-shrink-0">
                        {col.code}
                      </div>
                      <div>
                        <Link
                          to={`/admin/colleges/${col.id}`}
                          className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors block"
                        >
                          {col.name}
                        </Link>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Code: {col.code}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <Badge variant={isSuspended ? 'red' : 'green'} size="sm">
                      {isSuspended ? 'Suspended' : 'Active'}
                    </Badge>
                  </td>

                  {/* Student Limit Progress */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-gray-800">
                      {enrolled} / {limit.toLocaleString()}
                    </div>
                    <div className="w-28 bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentUsed > 90 ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${percentUsed}%` }}
                      />
                    </div>
                  </td>

                  {/* Valid Until */}
                  <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px]">
                    {col.validUntil || col.valid_until || '2027-12-31'}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <Link
                        to={`/admin/colleges/${col.id}`}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-medium transition-colors"
                      >
                        Overview
                      </Link>

                      <Link
                        to={`/admin/colleges/${col.id}/template`}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded text-[11px] font-semibold transition-colors"
                      >
                        Template 🎨
                      </Link>

                      {/* Suspend / Activate Toggle */}
                      {onToggleStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(col)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                            isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={isSuspended ? 'Activate College' : 'Suspend College'}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}

                      {/* Edit */}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(col)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                          title="Edit College"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Delete */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(col)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete College"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
