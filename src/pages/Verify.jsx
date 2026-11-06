import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../services/studentService';
import Badge from '../components/common/Badge';

export default function Verify() {
  const { cardId } = useParams();
  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState(null);

  useEffect(() => {
    async function loadVerification() {
      setLoading(true);
      try {
        const data = await studentService.verifyCard(cardId);
        setCardData(data);
      } catch (err) {
        console.error('Verification query failed:', err);
        setCardData(null);
      } finally {
        setLoading(false);
      }
    }

    if (cardId) {
      loadVerification();
    } else {
      setLoading(false);
    }
  }, [cardId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xl max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-700">Verifying ID Card Authenticity...</p>
          <p className="text-xs text-gray-400 font-mono">Token: {cardId}</p>
        </div>
      </div>
    );
  }

  const isExpired = cardData?.valid_until && new Date(cardData.valid_until) < new Date();
  const isValid = cardData && cardData.status === 'approved' && !isExpired;

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 max-w-lg w-full overflow-hidden">
        {/* Verification Status Banner */}
        <div
          className={`p-6 text-center text-white ${
            isValid ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 border border-white/30 shadow-xs">
            {isValid ? '✓' : '✕'}
          </div>
          <h2 className="text-xl font-extrabold uppercase tracking-wider">
            {isValid ? 'Official Valid ID Card' : 'Invalid or Expired ID Card'}
          </h2>
          <p className="text-xs text-white/90 mt-1">
            {isValid
              ? 'This digital credential was verified by the issuing institution.'
              : 'This digital ID card could not be verified or has expired.'}
          </p>
        </div>

        {/* Card Details Body */}
        {isValid && cardData ? (
          <div className="p-6 space-y-6">
            {/* Student Header */}
            <div className="flex items-center space-x-4 pb-4 border-b border-gray-100">
              <div className="w-20 h-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-emerald-500 shadow-sm flex-shrink-0">
                {cardData.photo_url ? (
                  <img
                    src={cardData.photo_url}
                    alt={cardData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                    PHOTO
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {cardData.name}
                </h3>
                <p className="text-xs font-mono font-semibold text-emerald-700 mt-0.5">
                  {cardData.roll_no}
                </p>
                <div className="mt-2">
                  <Badge variant="green" size="sm">
                    Verified Active Student
                  </Badge>
                </div>
              </div>
            </div>

            {/* Institution & Program Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                  Issuing College
                </span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {cardData.college_name}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                  Academic Department
                </span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  {cardData.department_name}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                  Current Year
                </span>
                <span className="font-bold text-gray-900 block mt-0.5">
                  Year {cardData.year}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
                  Valid Until
                </span>
                <span className="font-bold text-emerald-700 font-mono block mt-0.5">
                  {cardData.valid_until}
                </span>
              </div>
            </div>

            {/* Verification Metadata */}
            <div className="text-center pt-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Public Card ID Token
              </span>
              <span className="text-[11px] font-mono text-gray-600 block break-all bg-gray-50 p-2 rounded-lg border mt-1">
                {cardId}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-gray-600">
              The ID card with token <code className="font-mono font-bold bg-gray-100 px-1 py-0.5 rounded">{cardId}</code> is not registered, has not yet been approved by the college registrar, or has expired.
            </p>
            <p className="text-xs text-gray-400">
              Please contact the issuing college administration office for assistance.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Powered by CardCraft SaaS</span>
          <Link to="/" className="text-blue-600 font-semibold hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
