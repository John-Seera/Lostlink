import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, Upload, Tag, MapPin, Calendar, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Toast from '../components/Toast';
import ImagePicker from '../components/ImagePicker';
import { useRealtime } from '../context/RealtimeContext';

export default function ReportLost() {
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
        type: 'lost',
        title: formData.title,
        category: formData.category,
        color: formData.color,
        description: formData.additionalDetails
          ? `${formData.description} (Note: ${formData.additionalDetails})`
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
          title: 'Lost Item Reported (Live)',
          message: 'Your report is now live in the system across all devices.'
        });
        setTimeout(() => {
          navigate('/my-reports?type=lost');
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
          <FileQuestion className="w-3.5 h-3.5" />
          <span>SRS FR3: Lost Item Reporting Module</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Report a Lost Belonging</h1>
        <p className="text-sm text-slate-400">
          Provide accurate details so our AI matching engine can cross-reference found registries across campus.
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
                Item Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Black Leather Wallet or AirPods Pro"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
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
                Primary Color <span className="text-rose-400">*</span>
              </label>
              <select
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
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
                Location Lost <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                list="location-options"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. College Library, Block B, Canteen"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
              <datalist id="location-options">
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
                Date Missing <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
              />
            </div>
          </div>

          {/* Choose an optional photo directly from this device. */}
          <ImagePicker
            value={formData.imageUrl}
            onChange={(val) => setFormData(prev => ({ ...prev, imageUrl: val }))}
            onProcessingChange={setImageProcessing}
            accentColor="rose"
          />

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Detailed Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              name="description"
              required
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Include identifying marks, brand, condition, or circumstances under which it was lost..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Additional Details / Private Verification Clues
            </label>
            <input
              type="text"
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleChange}
              placeholder="e.g. Engraved initials on clasp or hidden card inside slot"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <FileQuestion className="w-4 h-4" />
              {imageProcessing ? 'Preparing Photo...' : loading ? 'Submitting Report...' : 'Publish Lost Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
