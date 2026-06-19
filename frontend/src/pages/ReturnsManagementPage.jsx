import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function ReturnsManagementPage() {
  const addToast = useToast();
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tabFilter, setTabFilter] = useState('pending');
  const [search, setSearch] = useState('');
  
  // Review Modal state
  const [reviewModal, setReviewModal] = useState(null); // returnRequest object
  const [adminCondition, setAdminCondition] = useState('good');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [overrideFine, setOverrideFine] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns');
      setReturns(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load returns list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/returns/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchStats();
  }, []);

  useSocket({
    return_requested: (data) => {
      setReturns(prev => [data, ...prev.filter(r => r._id !== data._id)]);
      addToast(`New equipment return request from ${data.studentId?.name || 'student'}`, 'info');
      fetchStats();
    },
    return_approved: () => {
      fetchReturns();
      fetchStats();
    },
    return_rejected: () => {
      fetchReturns();
      fetchStats();
    }
  });

  const openReviewModal = (ret) => {
    setReviewModal(ret);
    setAdminCondition(ret.condition);
    setAdminRemarks('');
    setOverrideFine(ret.fineAmount);
  };

  const handleApproveReturn = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;

    setSubmittingReview(true);
    try {
      await api.put(`/returns/approve/${reviewModal._id}`, {
        condition: adminCondition,
        remarks: adminRemarks,
        overrideFine: Number(overrideFine)
      });
      addToast('Return request approved successfully! ↩️', 'success');
      setReviewModal(null);
      fetchReturns();
      fetchStats();
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRejectReturn = async () => {
    if (!reviewModal) return;
    if (!adminRemarks.trim()) {
      addToast('Please enter remarks/reason for rejection.', 'warning');
      return;
    }

    setRejecting(true);
    try {
      await api.put(`/returns/reject/${reviewModal._id}`, {
        reason: adminRemarks
      });
      addToast('Return request rejected.', 'info');
      setReviewModal(null);
      fetchReturns();
      fetchStats();
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed.', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const filteredReturns = returns
    .filter(r => tabFilter === 'all' ? true : r.status === tabFilter)
    .filter(r => search
      ? r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.equipmentId?.name?.toLowerCase().includes(search.toLowerCase())
      : true
    );

  const counts = {
    all: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Returns Management</h1>
        <p className="text-slate-400 mt-1">Review and approve returned equipment from students</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Returns', value: stats?.pendingReturns, icon: '⏳', color: 'text-amber-400' },
          { label: 'Approved Today', value: stats?.approvedToday, icon: '✅', color: 'text-emerald-400' },
          { label: 'Overdue Returns', value: stats?.overdueReturns, icon: '⚠️', color: (stats?.overdueReturns || 0) > 0 ? 'text-rose-500' : 'text-slate-400' },
          { label: 'Total Issued Stock', value: stats?.totalIssued, icon: '📤', color: 'text-indigo-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-3xl font-bold ${s.color}`}>
                {statsLoading ? '—' : (s.value ?? 0)}
              </span>
            </div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'pending', label: '⏳ Pending', count: counts.pending },
            { key: 'approved', label: '✅ Approved', count: counts.approved },
            { key: 'rejected', label: '❌ Rejected', count: counts.rejected },
            { key: 'all', label: '📦 All Requests', count: counts.all }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTabFilter(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tabFilter === t.key
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by student, roll number, equipment..."
          className="input-field max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="text-4xl mb-3 opacity-30">↩️</div>
          <p className="text-slate-500">No return requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {filteredReturns.map(ret => {
            const isLate = ret.isLateReturn;
            const remainingQty = ret.equipmentRequestId?.quantity - (ret.equipmentRequestId?.returnedQuantity || 0);

            return (
              <div key={ret._id} className={`card p-5 border ${ret.status === 'pending' ? 'border-indigo-500/20 hover:border-indigo-500/40' : 'border-slate-800'} transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
                      {ret.equipmentId?.icon || '🎯'}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{ret.equipmentId?.name}</div>
                      <div className="text-xs text-slate-500">{ret.equipmentId?.sport}</div>
                    </div>
                  </div>
                  <StatusBadge status={ret.status} />
                </div>

                <div className="space-y-2.5 text-xs border-t border-b border-slate-800/80 py-3 mb-4 text-slate-400">
                  <div className="flex justify-between">
                    <span>Student:</span>
                    <span className="text-white font-medium">{ret.studentId?.name} ({ret.studentId?.rollNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dept/Course:</span>
                    <span className="text-white">{ret.studentId?.department || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qty Returning:</span>
                    <span className="text-indigo-400 font-bold text-sm">{ret.quantity} unit{ret.quantity > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Condition:</span>
                    <span className={`font-semibold capitalize ${
                      ret.condition === 'good' ? 'text-emerald-400' :
                      ret.condition === 'damaged' ? 'text-rose-400' : 'text-red-500'
                    }`}>{ret.condition}</span>
                  </div>
                  {ret.conditionNotes && (
                    <div className="flex justify-between">
                      <span>Student Notes:</span>
                      <span className="text-slate-300 italic">"{ret.conditionNotes}"</span>
                    </div>
                  )}
                  {ret.equipmentRequestId && (
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span>{fmt(ret.equipmentRequestId.issuedAt)}</span>
                    </div>
                  )}
                  {ret.equipmentRequestId?.expectedReturnDate && (
                    <div className="flex justify-between">
                      <span>Expected Due Date:</span>
                      <span className={isLate ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {fmt(ret.equipmentRequestId.expectedReturnDate)}
                      </span>
                    </div>
                  )}
                  {isLate && (
                    <div className="flex justify-between text-rose-400 font-semibold bg-rose-500/10 px-2 py-1 rounded">
                      <span>🚨 Late Return Fine:</span>
                      <span>₹{ret.fineAmount}</span>
                    </div>
                  )}
                </div>

                {ret.status === 'pending' ? (
                  <button
                    onClick={() => openReviewModal(ret)}
                    className="w-full btn-primary py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                  >
                    🔍 Review & Action Return
                  </button>
                ) : (
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Processed By:</span>
                      <span>{ret.reviewedBy?.name || 'Admin'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{fmt(ret.reviewedAt)}</span>
                    </div>
                    {ret.remarks && (
                      <div className="flex justify-between">
                        <span>Remarks:</span>
                        <span className="text-slate-300 font-medium">"{ret.remarks}"</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Review Return Request</h2>
                  <p className="text-xs text-slate-500">Assess condition and complete returned items</p>
                </div>
              </div>
              <button onClick={() => setReviewModal(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleApproveReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Final Condition Assessment</label>
                <select
                  className="input-field"
                  value={adminCondition}
                  onChange={e => setAdminCondition(e.target.value)}
                  required
                >
                  <option value="good">Good Condition (Return to Available Stock)</option>
                  <option value="damaged">Damaged (Move to Damaged Inventory)</option>
                  <option value="lost">Lost Item (Move to Lost Inventory)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Fine Amount (₹)</label>
                <input
                  type="number"
                  className="input-field"
                  min={0}
                  value={overrideFine}
                  onChange={e => setOverrideFine(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Calculated fine based on late status. You can adjust this.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Admin Remarks / Rejection Reason</label>
                <textarea
                  className="input-field h-20 resize-none py-2"
                  placeholder="Add remarks or justification..."
                  value={adminRemarks}
                  onChange={e => setAdminRemarks(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRejectReturn}
                  disabled={rejecting}
                  className="btn-secondary flex-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10"
                >
                  {rejecting ? 'Rejecting...' : '❌ Reject Return'}
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary flex-1"
                >
                  {submittingReview ? 'Approving...' : '✅ Approve Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
