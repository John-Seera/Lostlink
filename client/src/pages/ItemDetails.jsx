import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import api from '../services/api';
import {
  Tag,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle,
  FileQuestion,
  PlusCircle,
  ArrowLeft,
  Trash2,
  Edit,
  Clock,
  Building,
  AlertCircle
} from 'lucide-react';
import ClaimModal from '../components/ClaimModal';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { emitRealtimeEvent, subscribe } = useRealtime();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchItemDetails = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await api.get(`/items/${id}`);
      setItem(res.data?.data);
    } catch (err) {
      if (!isSilent) {
        setError(err.response?.data?.message || 'Failed to load item information');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItemDetails();

    // Subscribe to live events
    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'ITEM_UPDATED' ||
        event.type === 'CLAIM_UPDATED' ||
        event.type === 'CLAIM_CREATED' ||
        event.type === 'MANUAL_SYNC'
      ) {
        fetchItemDetails(true);
      } else if (event.type === 'ITEM_DELETED' && (event.data?.id === id || event.data?._id === id)) {
        navigate('/browse');
      }
    });

    return () => unsubscribe();
  }, [id, fetchItemDetails, subscribe, navigate]);

  const isReporter =
    user && item?.reportedBy && (item.reportedBy._id === user._id || item.reportedBy === user._id);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      let res;
      if (isAdmin) {
        res = await api.put(`/admin/items/${item._id}/status`, { status: newStatus });
      } else {
        res = await api.put(`/items/${item._id}`, { status: newStatus });
      }
      emitRealtimeEvent('ITEM_UPDATED', { id: item._id, status: newStatus, item: res.data?.data });
      setToast({
        type: 'success',
        title: 'Status Updated (Live)',
        message: `Item status marked as ${newStatus} in real-time.`
      });
      fetchItemDetails(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || err.message
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this report?')) return;
    try {
      if (isAdmin) {
        await api.delete(`/admin/items/${item._id}`);
      } else {
        await api.delete(`/items/${item._id}`);
      }
      emitRealtimeEvent('ITEM_DELETED', { id: item._id });
      navigate('/browse');
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || err.message
      });
    }
  };

  if (loading) return <Loader message="Loading item details..." size="lg" />;

  if (error || !item) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 glass-panel rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Item Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'This report may have been removed or closed.'}</p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Browse Catalog
        </Link>
      </div>
    );
  }

  const isLost = item.type === 'lost';
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ClaimModal
        item={item}
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        onSuccess={() => {
          setToast({
            type: 'success',
            title: 'Claim Submitted Successfully',
            message: 'Your verification claim has been sent to the reporter/admin.'
          });
          fetchItemDetails();
        }}
      />

      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to previous page
        </button>
      </div>

      {/* Main Details Card (FR10) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-10">
          {/* Left Column: Image */}
          <div className="space-y-4">
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-600 space-y-2 p-6 text-center">
                  <Tag className="w-16 h-16" />
                  <p className="text-xs text-slate-500">No photo uploaded with report</p>
                </div>
              )}

              {/* Status and Type Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg ${
                    isLost ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {item.type} Item
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-semibold uppercase tracking-wider bg-slate-900/90 text-slate-300 border border-slate-700 capitalize backdrop-blur-md">
                  {item.status}
                </span>
              </div>
            </div>

            {/* If user is reporter or admin, allow status management */}
            {(isReporter || isAdmin) && (
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Manage Item Status (FR13)
                  </span>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Report
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['active', 'matched', 'claimed', 'closed'].map((st) => (
                    <button
                      key={st}
                      disabled={updatingStatus || item.status === st}
                      onClick={() => handleStatusChange(st)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                        item.status === st
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Information per SRS FR10 */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  {item.category}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {item.title}
                </h1>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Item Description
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  {item.description}
                </p>
              </div>

              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Location</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{item.location}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>Color</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{item.color}</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 col-span-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reported Incident Date</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{formattedDate}</div>
                </div>
              </div>

              {/* Reporter Information (SRS FR10: Reporter information where permitted) */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reporter Details</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <p>
                    <span className="text-slate-500">Name:</span>{' '}
                    <span className="font-medium text-white">{item.reportedBy?.name || 'Campus Student'}</span>
                  </p>
                  <p>
                    <span className="text-slate-500">Organization:</span>{' '}
                    <span className="text-slate-300">{item.reportedBy?.organization || 'Apex University'}</span>
                  </p>
                  {isAdmin && item.reportedBy?.email && (
                    <p>
                      <span className="text-slate-500">Admin Email:</span>{' '}
                      <span className="text-blue-400 font-mono">{item.reportedBy.email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Bar: Submit Claim if it is a found item */}
            <div className="pt-4 border-t border-slate-800">
              {item.type === 'found' ? (
                item.status === 'active' || item.status === 'matched' ? (
                  isReporter ? (
                    <div className="p-3 rounded-2xl bg-slate-800/80 text-xs text-center text-slate-400">
                      You reported finding this item. You will be notified when another user submits an ownership claim.
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsClaimModalOpen(true)}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      Claim This Item (FR11 Ownership Verification)
                    </button>
                  )
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-900 text-xs text-center text-slate-400 border border-slate-800">
                    This item has already been marked as <span className="font-semibold text-white capitalize">{item.status}</span>.
                  </div>
                )
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-center text-slate-400">
                  This is a missing / lost item report. If you have found it, please contact the campus security office or use the AI assistant.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
