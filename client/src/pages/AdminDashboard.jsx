import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import api from '../services/api';
import {
  ShieldCheck,
  Users,
  Layers,
  CheckCircle,
  XCircle,
  Trash2,
  Tag,
  Building,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  X,
  Radio
} from 'lucide-react';
import StatsCharts from '../components/StatsCharts';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { emitRealtimeEvent, subscribe, forceSync, isLive } = useRealtime();

  const [activeTab, setActiveTab] = useState('claims'); // 'claims' | 'items' | 'users'
  const [stats, setStats] = useState(null);
  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // In-App Modal Dialog for friendly claim actions (instead of native window.prompt)
  const [claimActionModal, setClaimActionModal] = useState({
    isOpen: false,
    claim: null,
    status: 'approved',
    adminNotes: ''
  });

  // In-App Modal Dialog for item deletion
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    item: null
  });

  const fetchAdminData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);

      const [statsRes, claimsRes, itemsRes, usersRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { data: null } })),
        api.get('/admin/claims').catch(() => ({ data: { data: [] } })),
        api.get('/admin/items').catch(() => ({ data: { data: [] } })),
        api.get('/admin/users').catch(() => ({ data: { data: [] } }))
      ]);

      setStats(statsRes.data?.data);
      setClaims(claimsRes.data?.data || []);
      setItems(itemsRes.data?.data || []);
      setUsersList(usersRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();

    // Subscribe to live events across the platform
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
        fetchAdminData(true);
      }
    });

    return () => unsubscribe();
  }, [fetchAdminData, subscribe]);

  const openClaimActionModal = (claim, status) => {
    setClaimActionModal({
      isOpen: true,
      claim,
      status,
      adminNotes:
        status === 'approved'
          ? 'Proof verified. Item is available at the Security Desk.'
          : 'Verification proof details do not match item characteristics.'
    });
  };

  const handleConfirmClaimAction = async () => {
    const { claim, status, adminNotes } = claimActionModal;
    if (!claim) return;

    try {
      setProcessingId(claim._id);
      const res = await api.put(`/admin/claims/${claim._id}`, {
        status,
        adminNotes: adminNotes || ''
      });

      if (res.data?.success) {
        emitRealtimeEvent('CLAIM_UPDATED', {
          claimId: claim._id,
          status,
          claim: res.data?.data
        });

        setToast({
          type: 'success',
          title: `Claim ${status} (Live)`,
          message: `Claim status updated to ${status} in real-time.`
        });
        setClaimActionModal({ isOpen: false, claim: null, status: 'approved', adminNotes: '' });
        fetchAdminData(true);
      }
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.message || err.message
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleItemStatus = async (itemId, newStatus) => {
    try {
      setProcessingId(itemId);
      const res = await api.put(`/admin/items/${itemId}/status`, { status: newStatus });
      if (res.data?.success) {
        emitRealtimeEvent('ITEM_UPDATED', {
          itemId,
          status: newStatus,
          item: res.data?.data
        });
        setToast({
          type: 'success',
          title: 'Item Updated (Live)',
          message: `Item marked as ${newStatus} in real-time.`
        });
        fetchAdminData(true);
      }
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Status Update Failed',
        message: err.response?.data?.message || err.message
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmDeleteItem = async () => {
    const { item } = deleteConfirmModal;
    if (!item) return;

    try {
      setProcessingId(item._id);
      await api.delete(`/admin/items/${item._id}`);
      emitRealtimeEvent('ITEM_DELETED', { id: item._id });
      setToast({
        type: 'success',
        title: 'Report Deleted (Live)',
        message: 'Inappropriate item report removed in real-time.'
      });
      setDeleteConfirmModal({ isOpen: false, item: null });
      fetchAdminData(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.response?.data?.message || err.message
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Loader message="Accessing Administrative Control Center..." size="lg" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Modern In-App Claim Review Modal */}
      {claimActionModal.isOpen && claimActionModal.claim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              onClick={() => setClaimActionModal({ isOpen: false, claim: null, status: 'approved', adminNotes: '' })}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  claimActionModal.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {claimActionModal.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white capitalize">
                  {claimActionModal.status} Ownership Claim
                </h3>
                <p className="text-xs text-slate-400">
                  Item: {claimActionModal.claim.itemId?.title || 'Reported Belonging'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Claimant:</span>
                <span className="text-white font-medium">
                  {claimActionModal.claim.claimantId?.name} ({claimActionModal.claim.claimantId?.email})
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] block">Explanation:</span>
                <p className="text-slate-200 mt-0.5">{claimActionModal.claim.message}</p>
              </div>
              <div>
                <span className="text-blue-400 font-semibold uppercase text-[10px] block">Verification Proof:</span>
                <p className="text-slate-200 mt-0.5">{claimActionModal.claim.verificationAnswer}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Officer Notes / Instructions to Claimant:
              </label>
              <textarea
                rows="3"
                value={claimActionModal.adminNotes}
                onChange={(e) =>
                  setClaimActionModal((prev) => ({ ...prev, adminNotes: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="Enter feedback or pickup instructions..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setClaimActionModal({ isOpen: false, claim: null, status: 'approved', adminNotes: '' })}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === claimActionModal.claim._id}
                onClick={handleConfirmClaimAction}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all flex items-center gap-1.5 ${
                  claimActionModal.status === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {claimActionModal.status === 'approved' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Confirm {claimActionModal.status === 'approved' ? 'Approval' : 'Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && deleteConfirmModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Item Report?</h3>
                <p className="text-xs text-slate-400">SRS FR13: Moderation Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to permanently remove "<strong>{deleteConfirmModal.item.title}</strong>"? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ isOpen: false, item: null })}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingId === deleteConfirmModal.item._id}
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/20"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>SRS FR13: Administrative Platform Operations</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${isLive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <span>{isLive ? 'Live Synced' : 'Offline'}</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Campus Administration Portal</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Platform governance, user verification, report moderation, and ownership approvals in real-time
          </p>
        </div>

        <button
          onClick={() => {
            forceSync();
            fetchAdminData(true);
          }}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh Registry</span>
        </button>
      </div>

      {/* Overview Analytics Charts */}
      {stats && <StatsCharts stats={stats} items={items} />}

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'claims'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Ownership Claims ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'items'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Lost & Found Items ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Registered Users ({usersList.length})
        </button>
      </div>

      {/* Tab 1: Claims Moderation (FR13: Approve / Reject Claims) */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="p-12 text-center text-slate-400 glass-panel rounded-3xl">
              No claims submitted across the platform.
            </div>
          ) : (
            claims.map((claim) => {
              const item = claim.itemId;
              const claimant = claim.claimantId;

              return (
                <div
                  key={claim._id}
                  className="p-6 rounded-3xl glass-panel border border-slate-800 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      {item?.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base">
                            {item?.title || 'Unknown Item'}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              claim.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : claim.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {claim.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Claimant: <span className="text-white font-medium">{claimant?.name || 'Student'}</span> ({claimant?.email}) • Org: {claimant?.organization}
                        </p>
                      </div>
                    </div>

                    {/* Admin Verification Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openClaimActionModal(claim, 'approved')}
                        disabled={processingId === claim._id || claim.status === 'approved'}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve Claim
                      </button>
                      <button
                        onClick={() => openClaimActionModal(claim, 'rejected')}
                        disabled={processingId === claim._id || claim.status === 'rejected'}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Claim
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Claimant Ownership Narrative:
                      </span>
                      <p className="text-slate-200">{claim.message}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                        Verification Answers (Private Proof):
                      </span>
                      <p className="text-slate-200">{claim.verificationAnswer}</p>
                    </div>
                  </div>

                  {claim.adminNotes && (
                    <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300">
                      <span className="font-semibold">Reviewer Notes: </span>
                      {claim.adminNotes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Item Moderation (FR13: Mark as Matched/Closed, Delete Inappropriate) */}
      {activeTab === 'items' && (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 glass-panel">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Item</th>
                <th className="p-4">Type</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reporter</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 font-semibold text-white flex items-center gap-2">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <div>
                      <div className="truncate max-w-[200px]">{item.title}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{item.category} • {item.color}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === 'lost' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4">{item.location}</td>
                  <td className="p-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleItemStatus(item._id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 capitalize focus:outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="matched">Matched</option>
                      <option value="claimed">Claimed</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <span className="text-white">{item.reportedBy?.name || 'Member'}</span>
                    <span className="block text-[10px] text-slate-500">{item.reportedBy?.organization}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setDeleteConfirmModal({ isOpen: true, item })}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Remove Inappropriate Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Registered Users (FR13: Manage Users) */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 glass-panel">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Organization</th>
                <th className="p-4">Role</th>
                <th className="p-4">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {usersList.map((u) => (
                <tr key={u._id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-4 font-semibold text-white">{u.name}</td>
                  <td className="p-4 font-mono text-slate-400">{u.email}</td>
                  <td className="p-4">{u.phone || '—'}</td>
                  <td className="p-4">{u.organization || 'Campus'}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
