import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function EquipmentRequestsPage() {
  const addToast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/equipment/requests');
      setRequests(res.data.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  useSocket({
    equipment_requested: (data) => {
      setRequests(prev => [data, ...prev.filter(r => r._id !== data._id)]);
      addToast(`New equipment request from ${data.studentId?.name || 'a student'}`, 'info');
    },
    equipment_issued: () => fetchRequests(),
    equipment_rejected: () => fetchRequests(),
    equipment_returned: () => fetchRequests(),
  });

  const handleApprove = async (id) => {
    setActing(id + 'approve');
    try {
      await api.put(`/equipment/approve/${id}`);
      addToast('Equipment issued! ✅', 'success');
      fetchRequests();
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed.', 'error');
    } finally { setActing(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActing(rejectModal + 'reject');
    try {
      await api.put(`/equipment/reject/${rejectModal}`, { reason: rejectReason || 'Rejected by faculty.' });
      addToast('Request rejected.', 'warning');
      setRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (err) {
      addToast(err.response?.data?.message || 'Rejection failed.', 'error');
    } finally { setActing(null); }
  };

  const handleReturn = async (id) => {
    setActing(id + 'return');
    try {
      await api.put(`/equipment/return/${id}`);
      addToast('Equipment marked as returned! ↩️', 'info');
      fetchRequests();
    } catch (err) {
      addToast(err.response?.data?.message || 'Return failed.', 'error');
    } finally { setActing(null); }
  };

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    returned: requests.filter(r => r.status === 'returned').length,
  };

  const filtered = requests
    .filter(r => statusFilter === 'all' ? true : r.status === statusFilter)
    .filter(r => search
      ? r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.equipmentId?.name?.toLowerCase().includes(search.toLowerCase())
      : true
    );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Equipment Requests</h1>
        <p className="text-slate-400 mt-1">Issue and track sports equipment for students</p>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'pending', label: 'Pending', icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { key: 'approved', label: 'Issued', icon: '📤', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { key: 'returned', label: 'Returned', icon: '↩️', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { key: 'rejected', label: 'Rejected', icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
        ].map(c => (
          <button key={c.key} onClick={() => setStatusFilter(c.key)}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${c.bg} ${statusFilter === c.key ? 'ring-2 ring-indigo-500/50' : 'hover:brightness-110'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-lg">{c.icon}</span>
              <span className={`font-display text-2xl font-bold ${c.color}`}>{counts[c.key]}</span>
            </div>
            <div className="text-xs text-slate-400">{c.label}</div>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            className="input-field pl-9 py-2.5 text-sm"
            placeholder="Search by name, roll no, equipment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected', 'returned'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}>
              {s} {s !== 'all' && <span className="ml-1 opacity-70">({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 mb-4">{filtered.length} request{filtered.length !== 1 ? 's' : ''} shown</div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="text-4xl mb-3 opacity-30">🎯</div>
          <p className="text-slate-500">No {statusFilter === 'all' ? '' : statusFilter} equipment requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req._id} className="card p-5 hover:border-slate-700 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Student + equipment */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg font-bold text-indigo-300 flex-shrink-0">
                    {req.studentId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white">{req.studentId?.name}</div>
                    <div className="text-xs text-slate-500">
                      {req.studentId?.rollNumber && `${req.studentId.rollNumber} • `}{req.studentId?.department}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-base">{req.equipmentId?.icon}</span>
                      <span className="text-sm text-slate-300 font-medium">{req.equipmentId?.name}</span>
                      <span className="text-slate-600">×</span>
                      <span className="text-sm font-bold text-indigo-400">{req.quantity}</span>
                      {req.equipmentId?.sport && (
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{req.equipmentId.sport}</span>
                      )}
                    </div>
                    {req.purpose && (
                      <div className="text-xs text-slate-500 mt-1 truncate">Purpose: {req.purpose}</div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-600 mb-0.5">Requested</div>
                    <div className="text-slate-300">{fmt(req.createdAt)}</div>
                  </div>
                  {req.issuedAt && (
                    <div>
                      <div className="text-slate-600 mb-0.5">Issued</div>
                      <div className="text-emerald-400">{fmt(req.issuedAt)}</div>
                    </div>
                  )}
                  {req.returnedAt && (
                    <div>
                      <div className="text-slate-600 mb-0.5">Returned</div>
                      <div className="text-blue-400">{fmt(req.returnedAt)}</div>
                    </div>
                  )}
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={req.status} />
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(req._id)} disabled={acting === req._id + 'approve'}
                        className="btn-success text-xs py-1.5 px-3">
                        {acting === req._id + 'approve' ? '...' : '✅ Issue'}
                      </button>
                      <button onClick={() => { setRejectModal(req._id); setRejectReason(''); }}
                        className="btn-danger text-xs py-1.5 px-3">
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {req.status === 'approved' && (
                    <button onClick={() => handleReturn(req._id)} disabled={acting === req._id + 'return'}
                      className="btn-warning text-xs py-1.5 px-3">
                      {acting === req._id + 'return' ? '...' : '↩️ Mark Returned'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            <h2 className="font-display text-xl font-bold text-white mb-2">Reject Equipment Request</h2>
            <p className="text-sm text-slate-400 mb-5">Provide a reason for rejection (shown to the student).</p>
            <textarea
              className="input-field resize-none mb-4 text-sm"
              rows={3}
              placeholder="e.g. Equipment not available, quantity exceeded..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleReject} disabled={acting !== null} className="btn-danger flex-1">
                {acting ? 'Rejecting...' : '❌ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
