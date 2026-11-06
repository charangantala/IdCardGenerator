import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import {
  parseAndValidateStudentCsv,
  downloadSampleCsvTemplate,
} from '../../utils/csv';

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportComplete,
  existingRollNumbers = [],
  activeDepartment,
}) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null); // { validStudents, rowErrors }
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMessage('Please select a valid .csv file');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    setParsing(true);

    try {
      const result = await parseAndValidateStudentCsv(selectedFile, existingRollNumbers);
      setParseResult(result);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to parse CSV file');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || !parseResult.validStudents.length) return;

    // Attach active department if row doesn't have it
    const preparedStudents = parseResult.validStudents.map((s) => ({
      ...s,
      department: s.department || activeDepartment?.name || 'Computer Science & Engineering',
      department_id: activeDepartment?.id || 'dept-cse',
      status: 'draft',
    }));

    if (onImportComplete) {
      onImportComplete(preparedStudents);
    }
    handleClose();
  };

  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk CSV Student Import"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Helper Banner & Download Sample Link */}
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-blue-900">Upload CSV with student records</p>
            <p className="text-blue-700 mt-0.5">
              Columns: <code>name</code>, <code>roll_no</code>, <code>year</code>, <code>blood_group</code>, <code>phone</code>, <code>email</code>, <code>dob</code>, <code>gender</code>
            </p>
          </div>
          <button
            type="button"
            onClick={downloadSampleCsvTemplate}
            className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-lg font-bold hover:bg-blue-100/50 shadow-xs whitespace-nowrap ml-3"
          >
            Download Sample CSV 📥
          </button>
        </div>

        {/* File Dropzone / Picker */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-xl mx-auto mb-2">
              📄
            </div>
            <span className="text-xs font-bold text-blue-600 block hover:underline">
              {file ? file.name : 'Click to select CSV file from your device'}
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Supports bulk upload of hundreds of students in one go
            </span>
          </label>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {errorMessage}
          </div>
        )}

        {parsing && (
          <div className="text-center py-4 text-xs font-semibold text-gray-500">
            Analyzing and validating CSV rows...
          </div>
        )}

        {/* Results Overview */}
        {parseResult && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-3">
              <Badge variant="green" size="md">
                ✓ {parseResult.validStudents.length} Valid Students
              </Badge>
              {parseResult.rowErrors.length > 0 && (
                <Badge variant="red" size="md">
                  ✕ {parseResult.rowErrors.length} Rejected Rows
                </Badge>
              )}
            </div>

            {/* Row Errors Breakdown Table */}
            {parseResult.rowErrors.length > 0 && (
              <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/40">
                <div className="px-3 py-2 bg-rose-100 text-rose-900 text-xs font-bold uppercase tracking-wider">
                  Row-Level Error Report (These rows will be skipped):
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-rose-100 text-xs">
                  {parseResult.rowErrors.map((err, i) => (
                    <div key={i} className="p-2.5 flex items-start justify-between">
                      <div>
                        <span className="font-bold text-rose-800">
                          Row {err.rowNumber}:
                        </span>{' '}
                        <span className="font-semibold text-gray-800">
                          {err.name} ({err.rollNo})
                        </span>
                        <div className="text-[11px] text-rose-600 list-disc pl-4 mt-0.5">
                          {err.messages.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t">
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmImport}
            disabled={!parseResult || !parseResult.validStudents.length}
          >
            Import {parseResult?.validStudents.length || 0} Valid Students
          </Button>
        </div>
      </div>
    </Modal>
  );
}

