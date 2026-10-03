import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RotateCcw,
  Tag,
  MapPin,
  Calendar,
  Compass,
  ShieldAlert,
  Radio,
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import ItemCard from '../components/ItemCard';
import ClaimModal from '../components/ClaimModal';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import { useRealtime } from '../context/RealtimeContext';

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscribe, forceSync, lastSyncTime } = useRealtime();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedClaimItem, setSelectedClaimItem] = useState(null);
  const [toast, setToast] = useState(null);
  const [liveBanner, setLiveBanner] = useState(null);

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [color, setColor] = useState(searchParams.get('color') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');

  // Debounce search input for real-time live typing experience (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = [
    'All',
    'Personal Accessories',
    'Electronics',
    'Bags',
    'Documents/IDs',
    'Clothing',
    'Books/Stationery',
    'Others'
  ];

  const colors = [
    '', 'Black', 'Blue', 'Red', 'White', 'Silver', 'Grey', 'Green',
    'Yellow', 'Brown', 'Purple', 'Orange'
  ];

  const locations = [
    '', 'College Library', 'Block B', 'Block A', 'Canteen',
    'Computer Lab', 'Seminar Hall 3', 'Sports Complex'
  ];

  const fetchItems = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);

      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (type && type !== 'all') params.type = type;
      if (category && category !== 'All') params.category = category;
      if (status && status !== 'All') params.status = status;
      if (color) params.color = color;
      if (location) params.location = location;

      const res = await api.get('/items', { params });
      let list = res.data?.data || [];

      // Client-side date filter if specified
      if (date) {
        list = list.filter((item) => {
          const itemDate = new Date(item.date).toISOString().split('T')[0];
          return itemDate === date;
        });
      }

      setItems(list);
    } catch (err) {
      console.error('Failed to load items in Browse:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedSearch, type, category, status, color, location, date]);

  // Fetch when filters or debounced search change
  useEffect(() => {
    fetchItems(items.length > 0);
  }, [fetchItems]);

  // Subscribe to real-time events across all tabs
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'ITEM_CREATED' ||
        event.type === 'ITEM_UPDATED' ||
        event.type === 'ITEM_DELETED' ||
        event.type === 'CLAIM_UPDATED' ||
        event.type === 'MANUAL_SYNC' ||
        event.type === 'HEARTBEAT_SYNC'
      ) {
        fetchItems(true);

        if (event.type === 'ITEM_CREATED') {
          setLiveBanner({
            title: 'New Item Reported Just Now',
            message: `${event.data?.title || 'A new item'} was just listed and added to the catalog.`
          });
          setTimeout(() => setLiveBanner(null), 5000);
        }
      }
    });

    return () => unsubscribe();
  }, [subscribe, fetchItems]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleReset = () => {
    setSearch('');
    setDebouncedSearch('');
    setType('all');
    setCategory('All');
    setColor('');
    setLocation('');
    setDate('');
    setStatus('All');
    setSearchParams({});
  };

  // Count active filters
  const activeFilterCount = [
    search,
    type !== 'all' ? type : '',
    category !== 'All' ? category : '',
    color,
    location,
    date,
    status !== 'All' ? status : ''
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <ClaimModal
        item={selectedClaimItem}
        isOpen={!!selectedClaimItem}
        onClose={() => setSelectedClaimItem(null)}
        onSuccess={() => {
          setToast({
            type: 'success',
            title: 'Claim Submitted (Live)',
            message: 'Your verification request has been queued in real-time for review.'
          });
          fetchItems(true);
        }}
      />

      {/* Real-time Top Notification Banner */}
      {liveBanner && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900/60 to-blue-900/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-bold text-white">{liveBanner.title}:</span>
            <span>{liveBanner.message}</span>
          </div>
          <button
            onClick={() => setLiveBanner(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <Search className="w-3.5 h-3.5" />
              <span>Lost & Found Catalog</span>
            </div>
            {/* Real-time Live Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.8 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Real-Time Sync</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Browse Campus Registry</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time instant search across campus lost & found belongings.
          </p>
        </div>

        {/* Right Action Bar: Live refresh + Type Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              forceSync();
              fetchItems(true);
            }}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Force instant sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span>Sync Now</span>
          </button>

          {/* Type Toggle: All / Lost / Found */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setType('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                type === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setType('lost')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                type === 'lost'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Lost Only
            </button>
            <button
              onClick={() => setType('found')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                type === 'found'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Found Only
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4 relative overflow-hidden">
        {/* Subtle Live Syncing Progress Bar */}
        {isRefreshing && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 animate-pulse"></div>
        )}

        {/* Real-time search input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Instant search by keyword (e.g. 'black wallet', 'flask', 'Casio', 'keys')..."
              className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <span>Search</span>
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset All Filters"
              className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset ({activeFilterCount})</span>
            </button>
          )}
        </form>

        {/* Detailed Attribute Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-800/80">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Color
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Any Color</option>
              {colors.filter(Boolean).map((col) => (
                <option key={col} value={col} className="bg-slate-900 text-white">
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Any Campus Location</option>
              {locations.filter(Boolean).map((loc) => (
                <option key={loc} value={loc} className="bg-slate-900 text-white">
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="matched">Matched</option>
              <option value="claimed">Claimed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <span>Showing {items.length} item(s)</span>
          {isRefreshing && (
            <span className="text-blue-400 font-medium animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Syncing live changes...
            </span>
          )}
        </div>
        {search && <span className="font-mono text-slate-300">Filtering: "{search}"</span>}
      </div>

      {/* Items Grid */}
      {loading ? (
        <Loader message="Querying live LostLink registry..." />
      ) : items.length === 0 ? (
        <div className="p-16 rounded-3xl glass-panel text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No items found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No matching lost or found records match your current filter criteria. Try resetting filters or querying the AI assistant.
          </p>
          <button
            onClick={handleReset}
            className="mt-2 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onClaimClick={(itm) => setSelectedClaimItem(itm)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
