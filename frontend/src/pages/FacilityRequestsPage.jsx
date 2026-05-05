
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';

const fmt = (dt) =>
  dt
    ? new Date(dt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

export default function FacilityRequestsPage() {
  const addToast = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');

  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 🔄 Fetch
  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/facility/requests');
      setRequests(res.data?.data || []);
    } catch (err) {
      addToast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 🔌 Real-time updates
  useSocket({
    facility_requested: (data) => {
      setRequests((prev) => [data, ...prev.filter((r) => r._id !== data._id)]);
      addToast(`New request from ${data.studentId?.name || 'student'}`, 'info');
    },
    facility_approved: () => fetchRequests(true),
    facility_rejected: () => fetchRequests(true),
    facility_released: () => fetchRequests(true),
  });

  // ⚙️ Actions
  const handleApprove = async (id) => {
    setActing(id + 'approve');
    try {
      await api.put(`/facility/approve/${id}`);
      addToast('Approved ✅', 'success');
      fetchRequests(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Approval failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;

    setActing(rejectModal + 'reject');
    try {
      await api.put(`/facility/reject/${rejectModal}`, {
        reason: rejectReason || 'Rejected by faculty',
      });

      addToast('Rejected ❌', 'warning');
      setRejectModal(null);
      setRejectReason('');
      fetchRequests(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Reject failed', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleRelease = async (id) => {
    setActing(id + 'release');
    try {
      await api.put(`/facility/release/${id}`);
      addToast('Released 🔓', 'info');
      fetchRequests(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Release failed', 'error');
    } finally {
      setActing(null);
    }
  };

  // 📊 Counts
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    released: requests.filter((r) => r.status === 'released').length,
  };

  // 🔍 Filter
  const filtered = requests
    .filter((r) =>
      statusFilter === 'all' ? true : r.status === statusFilter
    )
    .filter((r) =>
      search
        ? r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
          r.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
          r.sportId?.name?.toLowerCase().includes(search.toLowerCase())
        : true
    );

  return (
    <div>

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Facility Requests
          </h1>
          <p className="text-slate-400">
            Manage student booking requests
          </p>
        </div>

        <button
          onClick={() => fetchRequests(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['all', 'pending', 'approved', 'rejected', 'released'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        className="input-field mb-6 max-w-xs"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* List */}
      {loading ? (
        <div>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          No requests found
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req._id} className="card p-4">

              <div className="flex justify-between">
                <div>
                  <h2 className="text-white font-semibold">
                    {req.studentId?.name}
                  </h2>
                  <p className="text-sm text-slate-400">
                    {req.sportId?.name}
                  </p>
                </div>

                <StatusBadge status={req.status} />
              </div>

              <div className="text-xs text-slate-500 mt-2">
                {fmt(req.startTime)} → {fmt(req.endTime)}
              </div>

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                {req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(req._id)}
                      className="btn-success"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => setRejectModal(req._id)}
                      className="btn-danger"
                    >
                      Reject
                    </button>
                  </>
                )}

                {req.status === 'approved' && (
                  <button
                    onClick={() => handleRelease(req._id)}
                    className="btn-warning"
                  >
                    Release
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-white mb-3">Reject Request</h2>

            <textarea
              className="input-field mb-4"
              placeholder="Reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex gap-2">
              <button onClick={() => setRejectModal(null)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleReject} className="btn-danger">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

