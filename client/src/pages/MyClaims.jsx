import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, XCircle, Tag, MapPin, Calendar, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import Loader from '../components/Loader';
import { useRealtime } from '../context/RealtimeContext';

export default function MyClaims() {
  const { subscribe, forceSync } = useRealtime();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMyClaims = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      const res = await api.get('/claims/my');
      setClaims(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching user claims:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyClaims();

    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'CLAIM_UPDATED' ||
        event.type === 'CLAIM_CREATED' ||
        event.type === 'MANUAL_SYNC' ||
        event.type === 'HEARTBEAT_SYNC'
      ) {
        fetchMyClaims(true);
      }
    });

    return () => unsubscribe();
  }, [fetchMyClaims, subscribe]);

  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-amber-400" />,
    approved: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    rejected: <XCircle className="w-4 h-4 text-rose-400" />
  };

  const statusClasses = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  };

  if (loading) return <Loader message="Fetching your submitted claims..." size="lg" />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SRS FR11: Claim Verification Status</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Updates</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Ownership Claims</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Monitor the verification and approval status of items you have claimed in real-time
          </p>
        </div>

        <button
          onClick={() => {
            forceSync();
            fetchMyClaims(true);
          }}
          disabled={isRefreshing}
          className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
          <span>Sync Claims</span>
        </button>
      </div>

      {claims.length === 0 ? (
        <div className="p-16 rounded-3xl glass-panel text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No claims submitted yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            When you discover an item that matches your lost belonging, click "Claim" on its details page to submit verification proof.
          </p>
          <Link
            to="/browse?type=found"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Browse Found Items
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const item = claim.itemId;
            const formattedDate = claim.createdAt
              ? new Date(claim.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'Recent';

            return (
              <div
                key={claim._id}
                className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    {item?.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.title || 'Claimed item'}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {item?.title || 'Reported Belonging'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Claim ID: <span className="font-mono">{claim._id}</span> • Filed on {formattedDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border capitalize ${
                        statusClasses[claim.status] || statusClasses.pending
                      }`}
                    >
                      {statusIcons[claim.status]}
                      {claim.status}
                    </span>

                    {item && (
                      <Link
                        to={`/items/${item._id || item}`}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        title="View item card"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Claim details body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Your Ownership Explanation:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{claim.message}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                      Verification Proof Provided:
                    </span>
                    <p className="text-slate-200 leading-relaxed">{claim.verificationAnswer}</p>
                  </div>
                </div>

                {/* Admin notes if any */}
                {claim.adminNotes && (
                  <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-300">
                    <span className="font-semibold block mb-0.5">Verification Notes from Officer / Reporter:</span>
                    <p>{claim.adminNotes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
