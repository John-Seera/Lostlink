import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Tag, MapPin, Calendar, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';
import ImagePicker from '../components/ImagePicker';
import { useRealtime } from '../context/RealtimeContext';

export default function ReportFound() {
  const navigate = useNavigate();
  const { emitRealtimeEvent } = useRealtime();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Personal Accessories',
    color: 'Black',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    imageUrl: '',
    additionalDetails: ''
  });

  const [loading, setLoading] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const categories = [
    'Personal Accessories',
    'Electronics',
    'Bags',
    'Documents/IDs',
    'Clothing',
    'Books/Stationery',
    'Others'
  ];

  const colors = [
    'Black', 'Blue', 'Red', 'White', 'Silver', 'Grey', 'Green',
    'Yellow', 'Brown', 'Purple', 'Orange', 'Multi-color'
  ];

  const locations = [
    'College Library',
    'Block B',
    'Block A',
    'Canteen',
    'Computer Lab',
    'Seminar Hall 3',
    'Sports Complex',
    'Main Gate / Parking',
    'Hostel Area'
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.category || !formData.color || !formData.description || !formData.location) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        type: 'found',
        title: formData.title,
        category: formData.category,
        color: formData.color,
        description: formData.additionalDetails
          ? `${formData.description} (Found Details: ${formData.additionalDetails})`
          : formData.description,
        location: formData.location,
        date: formData.date,
        imageUrl: formData.imageUrl
      };

      const res = await api.post('/items', payload);

      if (res.data.success) {
        emitRealtimeEvent('ITEM_CREATED', res.data.data);
        setToast({
          type: 'success',
          title: 'Found Item Listed (Live)',
          message: 'The item is now available in real-time for campus owners to match and claim.'
        });
        setTimeout(() => {
          navigate('/my-reports?type=found');
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit found report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <PlusCircle className="w-3.5 h-3.5" />
          <span>SRS FR4: Found Item Reporting Module</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Report a Found Item</h1>
        <p className="text-sm text-slate-400">
          Help return misplaced belongings to their rightful campus owners safely.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Item Name / Title <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Casio Scientific Calculator or Blue Flask"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Category <span className="text-emerald-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Color & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Item Color <span className="text-emerald-400">*</span>
              </label>
              <select
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                {colors.map((col) => (
                  <option key={col} value={col} className="bg-slate-900 text-white">
                    {col}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Where Did You Find It? <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                list="found-locations"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Block B, Library Desk 4, Canteen"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <datalist id="found-locations">
                {locations.map((loc) => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 3: Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Date Found <span className="text-emerald-400">*</span>
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Choose an optional photo directly from this device. */}
          <ImagePicker
            value={formData.imageUrl}
            onChange={(val) => setFormData(prev => ({ ...prev, imageUrl: val }))}
            onProcessingChange={setImageProcessing}
            accentColor="emerald"
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Public Description <span className="text-emerald-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a general description so owners can recognize it, but withhold confidential secrets (like exact cash amount or passcode)..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Additional details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Additional Storage / Safe Custody Location
            </label>
            <input
              type="text"
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleChange}
              placeholder="e.g. Deposited with Security Desk at Block B or In Dean Office custody"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || imageProcessing}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {imageProcessing ? 'Preparing Photo...' : loading ? 'Submitting Found Report...' : 'Publish Found Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
