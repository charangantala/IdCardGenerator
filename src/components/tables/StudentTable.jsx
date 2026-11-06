import React from 'react';
import Badge from '../common/Badge';

/**
 * StudentTable - Interactive table displaying students with status badges & CRUD actions.
 */
export default function StudentTable({
  students = [],
  loading = false,
  error = null,
  onViewCard,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onAddNew,
}) {
  // 1. Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 py-3 border-b last:border-b-0">
            <div className="w-10 h-12 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
            <div className="h-6 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center text-rose-700">
        <p className="font-bold text-sm">Failed to load students</p>
        <p className="text-xs text-rose-500 mt-1">{error}</p>
      </div>
    );
  }

  // 3. Empty State
  if (!students || students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center text-xl mb-3">
          🎓
        </div>
        <h4 className="font-bold text-gray-800 text-sm">No Students Found</h4>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          No student records match the active department and year filter criteria.
        </p>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
          >
            + Add First Student
          </button>
        )}
      </div>
    );
  }

  // Helper for status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="green">Approved</Badge>;
      case 'submitted':
        return <Badge variant="yellow">Submitted</Badge>;
      case 'rejected':
        return <Badge variant="red">Rejected</Badge>;
      case 'draft':
      default:
        return <Badge variant="gray">Draft</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-200">
            <tr>
              <th className="py-3.5 px-4">Student</th>
              <th className="py-3.5 px-4">Roll Number</th>
              <th className="py-3.5 px-4">Year / Dept</th>
              <th className="py-3.5 px-4">Section</th>
              <th className="py-3.5 px-4">Status & Approver</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => {
              const photo = student.photoUrl || student.photo_url;
              const sectionCode = student.section || 'A';
              const approverName = student.approved_by || student.approver_name || student.faculty_name;
              return (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Photo & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                        {photo ? (
                          <img
                            src={photo}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold">ID</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{student.name}</div>
                        <div className="text-[11px] text-gray-500">{student.email || 'No email'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Roll No */}
                  <td className="py-3 px-4 font-mono font-semibold text-gray-800">
                    {student.rollNo || student.roll_no}
                  </td>

                  {/* Year / Dept */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">Year {student.year}</div>
                    <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                      {student.department || student.department_name}
                    </div>
                  </td>

                  {/* Section Badge */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Sec {sectionCode}
                    </span>
                  </td>

                  {/* Status & Faculty Approver */}
                  <td className="py-3 px-4">
                    {renderStatusBadge(student.status)}
                    {student.status === 'approved' && approverName && (
                      <div className="text-[10px] text-emerald-700 font-medium flex items-center space-x-1 mt-1">
                        <span>🛡️</span>
                        <span className="truncate max-w-[140px]" title={`Approved by ${approverName}`}>
                          By {approverName}
                        </span>
                      </div>
                    )}
                    {student.status === 'submitted' && approverName && (
                      <div className="text-[10px] text-amber-700 flex items-center space-x-1 mt-1">
                        <span>⏳</span>
                        <span className="truncate max-w-[140px]" title={`Pending approval by ${approverName}`}>
                          {approverName}
                        </span>
                      </div>
                    )}
                    {student.status === 'rejected' && student.reject_reason && (
                      <div className="text-[10px] text-rose-600 mt-1 line-clamp-1 italic" title={student.reject_reason}>
                        "{student.reject_reason}"
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* View Card */}
                      <button
                        type="button"
                        onClick={() => onViewCard && onViewCard(student)}
                        className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-medium text-[11px] transition-colors"
                        title="View ID Card"
                      >
                        Preview Card 🪪
                      </button>

                      {/* Approve action */}
                      {student.status !== 'approved' && onApprove && (
                        <button
                          type="button"
                          onClick={() => onApprove(student)}
                          className="px-2 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded font-medium text-[11px] transition-colors"
                          title="Approve Card"
                        >
                          Approve ✓
                        </button>
                      )}

                      {/* Reject action */}
                      {student.status !== 'rejected' && onReject && (
                        <button
                          type="button"
                          onClick={() => onReject(student)}
                          className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded font-medium text-[11px] transition-colors"
                          title="Reject with Reason"
                        >
                          Reject ✕
                        </button>
                      )}

                      {/* Edit */}
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(student)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded transition-colors"
                          title="Edit Details"
                        >
                          ✏️
                        </button>
                      )}

                      {/* Delete */}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(student)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Record"
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
