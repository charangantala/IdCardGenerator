import React, { useState, useRef } from 'react';
import IdCard from './IdCard';
import Badge from '../common/Badge';
import { downloadCardAsPng, downloadCardAsPdf } from '../../utils/downloadCard';

/**
 * IdCardPreview - Card preview container with responsive zoom/scale controls and PNG/PDF export.
 */
export default function IdCardPreview({
  student = {},
  template = {},
  status,
  onDownloadPng,
  onDownloadPdf,
}) {
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const cardNodeRef = useRef(null);

  const cardStatus = status || student?.status || 'approved';
  const isApproved = cardStatus === 'approved';
  const studentName = student?.name || 'student';
  const safeFilename = `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-id-card`;

  const getStatusBadge = () => {
    switch (cardStatus) {
      case 'approved':
        return <Badge variant="green">Approved</Badge>;
      case 'submitted':
        return <Badge variant="yellow">Under Review</Badge>;
      case 'rejected':
        return <Badge variant="red">Rejected</Badge>;
      case 'draft':
      default:
        return <Badge variant="gray">Draft</Badge>;
    }
  };

  const handleExportPng = async () => {
    if (!isApproved) return;
    if (onDownloadPng) {
      onDownloadPng();
      return;
    }

    const cardElement = cardNodeRef.current?.querySelector('.id-card-container');
    if (!cardElement) return;

    try {
      setIsExporting(true);
      await downloadCardAsPng(cardElement, `${safeFilename}.png`);
    } catch (err) {
      alert('Could not generate PNG card. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!isApproved) return;
    if (onDownloadPdf) {
      onDownloadPdf();
      return;
    }

    const cardElement = cardNodeRef.current?.querySelector('.id-card-container');
    if (!cardElement) return;

    try {
      setIsExporting(true);
      await downloadCardAsPdf(
        cardElement,
        `${safeFilename}.pdf`,
        template?.layout || 'vertical'
      );
    } catch (err) {
      alert('Could not generate PDF card. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Card Preview
          </span>
          {getStatusBadge()}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 rounded font-bold"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-[11px] font-mono px-1 text-gray-600">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(1.3, s + 0.1))}
            className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 rounded font-bold"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="px-1.5 py-0.5 text-[10px] text-gray-500 hover:text-gray-800 rounded ml-1"
            title="Reset"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Card Scaled Container */}
      <div className="w-full flex items-center justify-center p-4 bg-slate-100/70 rounded-2xl border border-slate-200 overflow-x-auto min-h-[380px]">
        <div
          ref={cardNodeRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          <IdCard student={student} template={template} />
        </div>
      </div>

      {/* Export Action Buttons (Enabled only when approved) */}
      <div className="w-full mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="text-left">
          <span className="text-xs font-bold text-gray-800 block">
            {isApproved ? 'Official Card Ready' : 'Download Locked'}
          </span>
          <span className="text-[10px] text-gray-500 block">
            {isApproved
              ? 'Print-ready 300 DPI high-resolution export'
              : 'Requires college approval before downloading'}
          </span>
        </div>

        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleExportPng}
            disabled={!isApproved || isExporting}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center space-x-1"
          >
            <span>{isExporting ? 'Generating...' : 'Download PNG 🖼️'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={!isApproved || isExporting}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors flex items-center space-x-1"
          >
            <span>{isExporting ? 'Generating...' : 'Download PDF 📄'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
