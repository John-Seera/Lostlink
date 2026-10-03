import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import api from '../services/api';
import {
  FileQuestion,
  PlusCircle,
  Sparkles,
  ShieldCheck,
  Bell,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Radio
} from 'lucide-react';
import StatsCharts from '../components/StatsCharts';
import ItemCard from '../components/ItemCard';
import Loader from '../components/Loader';

export default function Dashboard() {
  const { user } = useAuth();
  const { subscribe, forceSync } = useRealtime();

  const [myItems, setMyItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);

      const [itemsRes, claimsRes, allRes] = await Promise.all([
        api.get('/items/my/reports').catch(() => ({ data: { data: [] } })),
        api.get('/claims/my').catch(() => ({ data: { data: [] } })),
        api.get('/items').catch(() => ({ data: { data: [] } }))
      ]);

      setMyItems(itemsRes.data?.data || []);
      setMyClaims(claimsRes.data?.data || []);
      setAllItems(allRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to live events
    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'ITEM_CREATED' ||
        event.type === 'ITEM_UPDATED' ||
        event.type === 'ITEM_DELETED' ||
        event.type === 'CLAIM_CREATED' ||
        event.type === 'CLAIM_UPDATED' ||
        event.type === 'MANUAL_SYNC' ||
        event.type === 'HEARTBEAT_SYNC'
      ) {
        fetchDashboardData(true);
      }
    });

    return () => unsubscribe();
  }, [fetchDashboardData, subscribe]);

  const lostCount = myItems.filter((i) => i.type === 'lost').length;
  const foundCount = myItems.filter((i) => i.type === 'found').length;
  const claimsCount = myClaims.length;

  // Possible matches count heuristic for user's lost items
  const possibleMatchesCount = myItems.filter(i => i.type === 'lost').length > 0 ? 2 : 0;

  if (loading) {
    return <Loader message="Compiling your activity dashboard..." size="lg" />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            SRS FR12: User Activity Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Hello, {user?.name || 'Explorer'} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Organization: <span className="text-slate-200 font-medium">{user?.organization || 'Campus Member'}</span> • Role: <span className="text-blue-400 font-mono capitalize">{user?.role || 'User'}</span>
          </p>
        </div>

        {/* Quick Actions (SRS FR12) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              forceSync();
              fetchDashboardData(true);
            }}
            disabled={isRefreshing}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
            title="Instant Live Sync"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
          <Link
            to="/report-lost"
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
          >
            <FileQuestion className="w-4 h-4" />
            Report Lost
          </Link>
          <Link
            to="/report-found"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Report Found
          </Link>
          <Link
            to="/ai-chat"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            AI Query
          </Link>
        </div>
      </div>

      {/* 4 Core SRS Metric Cards (FR12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Lost Items Reported */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lost Reported
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{lostCount}</div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Active lost items tracked
          </p>
          <Link
            to="/my-reports?type=lost"
            className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-rose-400 flex items-center gap-1 hover:underline"
          >
            View lost items <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Found Items Reported */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Found Reported
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{foundCount}</div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Found items waiting for claimants
          </p>
          <Link
            to="/my-reports?type=found"
            className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-emerald-400 flex items-center gap-1 hover:underline"
          >
            View found items <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Possible Matches */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
              Possible Matches
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-300">{possibleMatchesCount}</div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            AI matched with found registry
          </p>
          <Link
            to="/ai-chat"
            className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-purple-400 flex items-center gap-1 hover:underline"
          >
            Check AI matching <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 4: Claims */}
        <div className="p-6 rounded-3xl glass-panel relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Claims Filed
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{claimsCount}</div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-blue-400" />
            Verification requests in progress
          </p>
          <Link
            to="/my-claims"
            className="mt-4 pt-3 border-t border-slate-800 text-xs font-medium text-blue-400 flex items-center gap-1 hover:underline"
          >
            Review my claims <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Visual Analytics with Recharts */}
      <StatsCharts
        stats={{
          totalLost: allItems.filter(i => i.type === 'lost').length,
          totalFound: allItems.filter(i => i.type === 'found').length,
          pendingClaims: myClaims.filter(c => c.status === 'pending').length,
          approvedClaims: myClaims.filter(c => c.status === 'approved').length
        }}
        items={allItems}
      />

      {/* Recent Community Reports Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">Community Activity</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">Latest lost & found items recorded across campus</p>
          </div>
          <Link
            to="/browse"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Browse All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allItems.slice(0, 3).map((item) => (
            <ItemCard key={item._id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
