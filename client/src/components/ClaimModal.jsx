import React, { useState } from 'react';
import { X, ShieldCheck, HelpCircle, Send, AlertTriangle } from 'lucide-react';
import { generateVerificationQuestions } from '../services/aiService';
import api from '../services/api';
import { useRealtime } from '../context/RealtimeContext';

export default function ClaimModal({ item, isOpen, onClose, onSuccess }) {
  if (!isOpen || !item) return null;

  const { emitRealtimeEvent } = useRealtime();
  const [message, setMessage] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const suggestedQuestions = generateVerificationQuestions(item.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !verificationAnswer.trim()) {
      setError('Please provide both ownership explanation and verification details.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.post('/claims', {
        itemId: item._id,
        message,
        verificationAnswer
      });

      if (res.data.success) {
        emitRealtimeEvent('CLAIM_CREATED', res.data.data);
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Submit Ownership Claim</h3>
            <p className="text-xs text-slate-400">SRS FR11: Claim & Verification Protocol</p>
          </div>
        </div>

        {/* Item Summary Banner */}
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 mb-6">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-12 h-12 rounded-xl object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
            <p className="text-xs text-slate-400">
              Found at {item.location} • {item.color}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Explanation of Ownership */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              1. Explanation of Ownership <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows="3"
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I dropped my black wallet near the library entrance on Monday after my 2 PM class. It contains my campus pass..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Verification Details */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                2. Verification Proof Details <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-blue-400">Private / Not Public</span>
            </div>
            <textarea
              rows="3"
              required
              value={verificationAnswer}
              onChange={(e) => setVerificationAnswer(e.target.value)}
              placeholder="Describe unique identifiers only the true owner would know: scratches, stickers, wallpaper, serial ending digits, card names..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Suggested Verification Prompts */}
          <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-300 font-medium">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Recommended Verification Answers for {item.category}:</span>
            </div>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[11px]">
              {suggestedQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>

          {/* Warning note */}
          <p className="text-[11px] text-slate-500 leading-tight">
            * By submitting, you affirm that this claim is authentic. False claims violate campus code of conduct. The reporter or administrator will review and verify your proof.
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Claim...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
