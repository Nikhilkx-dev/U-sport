import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';

const fmt = (dt) =>
  dt
    ? new Date(dt).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';

export default function FacilityReleasesPage() {
  const addToast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState('approve'); // approve, reject, force
  const [penaltyFine, setPenaltyFine] = useState(0);
  const [waiveFine, setWaiveFine] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await api.get('/facility/releases');
      setRequests(res.data?.data || []);
    } catch (err) {
      addToast('Failed to load facility releases', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useSocket({
    facility_release_requested: () => {
      fetchRequests(true);
      addToast('New facility release requested by student', 'info');
    },
    facility_released: () => {
      fetchRequests(true);
    },
    facility_release_rejected: () => {
      fetchRequests(true);
    },
    facility_auto_released: () => {
      fetchRequests(true);
    }
  });

  const openActionModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    
    // Suggest penalty if it's an overstay
    if (type === 'approve' || type === 'force') {
      const now = new Date();
      const end = new Date(req.endTime);
      if (now > end) {
        // Calculate minutes overstayed
        const mins = Math.floor((now - end) / (1000 * 60));
        // ₹10 per minute of overstay
        setPenaltyFine(mins * 10);
      } else {
        setPenaltyFine(0);
      }
    }
    setWaiveFine(false);
    setModalOpen(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmitting(true);
    try {
      if (actionType === 'approve') {
        await api.put(`/facility/approve-release/${selectedReq._id}`, {
          penaltyFine: waiveFine ? 0 : penaltyFine,
          waiveFine
        });
        addToast('Facility release approved', 'success');
      } else if (actionType === 'reject') {
        await api.put(`/facility/reject-release/${selectedReq._id}`);
        addToast('Facility release rejected, session is active', 'success');
      } else if (actionType === 'force') {
        await api.put(`/facility/force-release/${selectedReq._id}`);
        addToast('Facility session forcibly ended', 'success');
      }
      
      setModalOpen(false);
      fetchRequests(true);
    } catch (err) {
      addToast(err.response?.data?.message || `Failed to ${actionType} release`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter pending vs history
  const pendingRequests = requests.filter(r => r.status === 'pending_release');
  const activeRequests = requests.filter(r => ['active', 'overdue'].includes(r.status));
  const historyRequests = requests.filter(r => ['released', 'completed'].includes(r.status));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Facility Releases</h1>
          <p className="text-slate-400">Manage student facility release requests and active sessions</p>
        </div>
        <button
          onClick={() => fetchRequests(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-2"
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Pending Releases */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-amber-400">🔓</span> 
              Pending Release Approvals ({pendingRequests.length})
            </h2>
            
            {pendingRequests.length === 0 ? (
              <div className="card p-8 text-center text-slate-500">
                No pending release requests.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map(req => (
                  <div key={req._id} className="card p-5 border border-amber-500/20 bg-amber-950/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white">{req.sportId?.name}</h3>
                        <div className="text-sm text-slate-400">{req.studentId?.name} • {req.studentId?.rollNumber}</div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 mb-4">
                      <div><span className="text-slate-500">Time:</span> {fmt(req.startTime)} → {fmt(req.endTime)}</div>
                      <div><span className="text-slate-500">Req at:</span> {fmt(req.releaseRequestedAt)}</div>
                      {req.releaseRemarks && (
                        <div className="mt-2 p-2 rounded bg-slate-800/50 border border-slate-700/50 text-amber-200">
                          <span className="text-slate-500 block mb-1">Remarks:</span>
                          "{req.releaseRemarks}"
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openActionModal(req, 'approve')}
                        className="flex-1 py-1.5 px-3 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => openActionModal(req, 'reject')}
                        className="flex-1 py-1.5 px-3 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Sessions (Can force end) */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-indigo-400">🟢</span> 
              Active & Overdue Sessions ({activeRequests.length})
            </h2>
            
            {activeRequests.length === 0 ? (
              <div className="card p-8 text-center text-slate-500">
                No active sessions.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeRequests.map(req => {
                  const isOverdue = req.status === 'overdue' || new Date() > new Date(req.endTime);
                  return (
                    <div key={req._id} className={`card p-5 border ${isOverdue ? 'border-red-500/30 bg-red-950/10' : 'border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-bold text-white">{req.sportId?.name}</h3>
                          <div className="text-sm text-slate-400">{req.studentId?.name} • {req.studentId?.rollNumber}</div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 mb-4">
                        <div><span className="text-slate-500">Start:</span> {fmt(req.startTime)}</div>
                        <div><span className="text-slate-500">End:</span> <span className={isOverdue ? "text-red-400 font-bold" : ""}>{fmt(req.endTime)}</span></div>
                      </div>

                      <button
                        onClick={() => openActionModal(req, 'force')}
                        className="w-full py-1.5 px-3 bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-500/30 transition-colors"
                      >
                        🛑 Force End Session
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recently Released History */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-slate-400">📜</span> 
              Recently Released ({historyRequests.length})
            </h2>
            
            {historyRequests.length === 0 ? (
              <div className="card p-8 text-center text-slate-500">
                No history found.
              </div>
            ) : (
              <div className="space-y-3">
                {historyRequests.map(req => (
                  <div key={req._id} className="card p-4 bg-slate-900/40 border-slate-800/80">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-200">{req.sportId?.name}</h4>
                          <StatusBadge status={req.status} />
                        </div>
                        <div className="text-xs text-slate-400">
                          {req.studentId?.name} ({req.studentId?.rollNumber})
                        </div>
                      </div>
                      
                      <div className="text-xs text-slate-500 text-right space-y-1">
                        <div>Released: {fmt(req.releasedAt)}</div>
                        {req.isOverstay && <div className="text-rose-400 font-medium">Overstay Fine: ₹{req.penaltyFine || 0}</div>}
                        {req.releaseApprovedBy && <div>Approved By: {req.releaseApprovedBy?.name}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}

      {/* Action Modal */}
      {modalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">
                  {actionType === 'approve' && 'Approve Release'}
                  {actionType === 'reject' && 'Reject Release Request'}
                  {actionType === 'force' && 'Force End Session'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedReq.sportId?.name} - {selectedReq.studentId?.name}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-5">
              
              {actionType === 'approve' && (
                <div className="p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/30">
                  <p className="text-sm text-indigo-200 mb-3">
                    Are you sure you want to approve this release request? This will free up the facility slot.
                  </p>
                  
                  {new Date() > new Date(selectedReq.endTime) && (
                    <div className="mt-4 pt-4 border-t border-indigo-500/30">
                      <div className="flex items-center gap-2 text-rose-400 font-bold mb-3">
                        ⚠️ Overstay Detected
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">Penalty Fine (₹)</label>
                          <input 
                            type="number" 
                            className="input-field" 
                            value={penaltyFine}
                            onChange={(e) => setPenaltyFine(e.target.value)}
                            disabled={waiveFine}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                          <input 
                            type="checkbox" 
                            className="rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500"
                            checked={waiveFine}
                            onChange={(e) => setWaiveFine(e.target.checked)}
                          />
                          Waive penalty fine
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {actionType === 'reject' && (
                <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30">
                  <p className="text-sm text-red-200">
                    Are you sure you want to reject this release? The session will revert to active/overdue and the slot will remain occupied.
                  </p>
                </div>
              )}

              {actionType === 'force' && (
                <div className="p-4 rounded-xl bg-orange-900/20 border border-orange-500/30">
                  <p className="text-sm text-orange-200">
                    You are about to forcibly end this session. The slot will be freed immediately.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button 
                  type="submit" 
                  className={`flex-1 font-medium py-2 px-4 rounded-xl transition-all shadow-lg ${
                    actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20' :
                    actionType === 'reject' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' :
                    'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'
                  }`}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
