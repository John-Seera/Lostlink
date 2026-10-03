import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileQuestion, PlusCircle, Trash2, CheckCircle, Clock, ShieldCheck, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { useRealtime } from '../context/RealtimeContext';

export default function MyReports() {
  const [searchParams] = useSearchParams();
  const { emitRealtimeEvent, subscribe, forceSync, isLive } = useRealtime();

  const [activeTab, setActiveTab] = useState(searchParams.get('type') || 'all');
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchMyReports = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      const res = await api.get('/items/my/reports');
      setMyItems(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch user reports:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReports();

    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'ITEM_CREATED' ||
        event.type === 'ITEM_UPDATED' ||
        event.type === 'ITEM_DELETED' ||
        event.type === 'MANUAL_SYNC' ||
        event.type === 'HEARTBEAT_SYNC'
      ) {
        fetchMyReports(true);
      }
    });

    return () => unsubscribe();
  }, [fetchMyReports, subscribe]);

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/items/${itemId}`);
      emitRealtimeEvent('ITEM_DELETED', { id: itemId });
      setToast({
        type: 'success',
        title: 'Report Removed (Live)',
        message: 'The item listing has been deleted in real-time.'
      });
      fetchMyReports(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || err.message
      });
    }
  };

  const filteredItems = myItems.filter((item) => {
    if (activeTab === 'lost') return item.type === 'lost';
    if (activeTab === 'found') return item.type === 'found';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <FileQuestion className="w-3.5 h-3.5" />
              <span>My Registered Items</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${isLive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <span>{isLive ? 'Live Synced' : 'Offline'}</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Reports Management</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track and manage all items you have reported as lost or found in real-time
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              forceSync();
              fetchMyReports(true);
            }}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span>Sync Reports</span>
          </button>
        </div>
      </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Reports ({myItems.length})
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'lost'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Lost ({myItems.filter(i => i.type === 'lost').length})
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'found'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Found ({myItems.filter(i => i.type === 'found').length})
          </button>
        </div>

      {/* Reports List */}
      {loading ? (
        <Loader message="Loading your reports..." />
      ) : filteredItems.length === 0 ? (
        <div className="p-16 rounded-3xl glass-panel text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No items reported in this category</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't submitted any reports under this filter. You can file a lost or found report at any time.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/report-lost"
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500"
            >
              Report Lost Item
            </Link>
            <Link
              to="/report-found"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
            >
              Report Found Item
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="relative group">
              <ItemCard item={item} />
              <button
                onClick={() => handleDelete(item._id)}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-slate-400 hover:text-white border border-slate-700/80 transition-colors shadow-lg"
                title="Delete this report"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
