
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

export default function MyRequests() {
  const addToast = useToast();

  const [tab, setTab] = useState('facility');
  const [facilityReqs, setFacilityReqs] = useState([]);
  const [equipReqs, setEquipReqs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Return Modal states
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [returnQty, setReturnQty] = useState(1);
  const [returnCondition, setReturnCondition] = useState('good');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Facility Release Modal states
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedFacilityReq, setSelectedFacilityReq] = useState(null);
  const [releaseRemarks, setReleaseRemarks] = useState('');
  const [submittingRelease, setSubmittingRelease] = useState(false);

  // 🔄 Fetch data
  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [fRes, eRes] = await Promise.all([
        api.get('/facility/my-requests'),
        api.get('/equipment/my-requests'),
      ]);

      setFacilityReqs(fRes.data?.data || []);
      setEquipReqs(eRes.data?.data || []);
    } catch (err) {
      addToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // 🔌 Socket updates
  useSocket({
    facility_approved: () => {
      fetchAll(true);
      addToast('Facility approved 🎉', 'success');
    },
    facility_rejected: () => {
      fetchAll(true);
      addToast('Facility rejected ❌', 'error');
    },
    equipment_issued: () => {
      fetchAll(true);
      addToast('Equipment issued 🎉 Check Active Borrowed Items!', 'success');
    },
    equipment_rejected: () => {
      fetchAll(true);
      addToast('Equipment request rejected ❌', 'error');
    },
    return_approved: () => {
      fetchAll(true);
      addToast('Return request approved! Inventory restocked. ↩️', 'success');
    },
    return_rejected: () => {
      fetchAll(true);
      addToast('Return request rejected ❌', 'error');
    },
    facility_release_requested: () => {
      fetchAll(true);
      addToast('Facility release requested', 'success');
    },
    facility_released: () => {
      fetchAll(true);
      addToast('Facility session released 🔓', 'success');
    },
    facility_auto_released: () => {
      fetchAll(true);
      addToast('Facility session auto-completed 🏁', 'info');
    }
  });

  const handleReturnClick = (req) => {
    setSelectedReq(req);
    const maxReturn = req.quantity - (req.returnedQuantity || 0);
    setReturnQty(maxReturn);
    setReturnCondition('good');
    setReturnNotes('');
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSubmittingReturn(true);
    try {
      await api.post('/returns', {
        equipmentRequestId: selectedReq._id,
        quantity: Number(returnQty),
        condition: returnCondition,
        conditionNotes: returnNotes
      });
      addToast('Return request submitted for approval!', 'success');
      setReturnModalOpen(false);
      fetchAll(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit return request.', 'error');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleReleaseClick = (req) => {
    setSelectedFacilityReq(req);
    setReleaseRemarks('');
    setReleaseModalOpen(true);
  };

  const handleReleaseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFacilityReq) return;

    setSubmittingRelease(true);
    try {
      await api.post(`/facility/request-release/${selectedFacilityReq._id}`, {
        remarks: releaseRemarks
      });
      addToast('Facility release requested!', 'success');
      setReleaseModalOpen(false);
      fetchAll(true);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit release request.', 'error');
    } finally {
      setSubmittingRelease(false);
    }
  };

  const EmptyState = ({ text }) => (
    <div className="card py-16 flex flex-col items-center gap-3 text-center">
      <div className="text-4xl opacity-30">📋</div>
      <p className="text-slate-500">{text}</p>
    </div>
  );

  // Split equipment requests
  const activeBorrowed = equipReqs.filter(r => 
    ['approved', 'issued', 'pending_return', 'partially_returned', 'overdue'].includes(r.status)
  );

  const equipHistory = equipReqs.filter(r => 
    ['pending', 'returned', 'rejected', 'damaged', 'late_return'].includes(r.status)
  );

  // Split facility requests
  const activeFacilities = facilityReqs.filter(r => 
    ['approved', 'active', 'pending_release', 'overdue'].includes(r.status)
  );

  const facilityHistory = facilityReqs.filter(r => 
    ['pending', 'released', 'completed', 'cancelled', 'rejected'].includes(r.status)
  );

  return (
    <div>

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">My Requests</h1>
          <p className="text-slate-400">
            Track your facility & equipment requests
          </p>
        </div>

        {/* 🔄 Refresh */}
        <button
          onClick={() => fetchAll(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'facility', label: '🏟️ Facility', count: facilityReqs.length },
          { key: 'equipment', label: '🎯 Equipment', count: equipReqs.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm ${
              tab === t.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : tab === 'facility' ? (
        facilityReqs.length === 0 ? (
          <EmptyState text="No facility requests yet." />
        ) : (
          <div className="space-y-6">
            
            {/* 1. Active Facility Sessions */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Active Sessions</h3>
              {activeFacilities.length === 0 ? (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  No active facility sessions.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeFacilities.map((req) => {
                    const isOverdue = req.status === 'overdue' || new Date() > new Date(req.endTime);

                    return (
                      <div key={req._id} className={`card p-5 border ${isOverdue ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{req.sportId?.icon || '🏟️'}</span>
                              <h2 className="text-white font-semibold text-base">{req.sportId?.name}</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-xs text-slate-400">
                              <div>Start: <span className="text-slate-200">{fmt(req.startTime)}</span></div>
                              <div>End: <span className={isOverdue ? "text-red-400 font-bold" : "text-emerald-400"}>{fmt(req.endTime)}</span></div>
                              <div className="col-span-2 mt-1">Purpose: <span className="text-slate-300">{req.purpose}</span></div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <StatusBadge status={req.status} />
                            {['approved', 'active', 'overdue'].includes(req.status) && (
                              <button
                                onClick={() => handleReleaseClick(req)}
                                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                              >
                                🔓 End Session
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Facility History */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Booking History</h3>
              {facilityHistory.length === 0 ? (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  No history found.
                </div>
              ) : (
                <div className="space-y-3">
                  {facilityHistory.map((req) => (
                    <div key={req._id} className="card p-4 bg-slate-900/40 border border-slate-800/80">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>{req.sportId?.icon || '🏟️'}</span>
                          <h4 className="text-white font-medium text-sm">{req.sportId?.name}</h4>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      
                      <div className="flex flex-wrap justify-between items-center mt-3 pt-2.5 border-t border-slate-800/60 text-xs text-slate-500">
                        <div>Time: {fmt(req.startTime)} → {fmt(req.endTime)}</div>
                        {req.releasedAt && <div>Released: {fmt(req.releasedAt)}</div>}
                        {req.rejectionReason && <div className="text-red-400">Rejected: {req.rejectionReason}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )
      ) : (
        equipReqs.length === 0 ? (
          <EmptyState text="No equipment requests yet." />
        ) : (
          <div className="space-y-6">
            
            {/* 1. Active Borrowed Items */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Active Borrowed Items</h3>
              {activeBorrowed.length === 0 ? (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  No active borrowed items.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBorrowed.map((req) => {
                    const remaining = req.quantity - (req.returnedQuantity || 0);
                    const isOverdue = req.status === 'overdue' || (req.expectedReturnDate && new Date() > new Date(req.expectedReturnDate));

                    return (
                      <div key={req._id} className={`card p-5 border ${isOverdue ? 'border-red-500/40 bg-red-950/10' : 'border-slate-800'}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{req.equipmentId?.icon || '🎯'}</span>
                              <h2 className="text-white font-semibold text-base">{req.equipmentId?.name}</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-xs text-slate-400">
                              <div>Borrowed: <span className="text-slate-200 font-medium">{req.quantity} units</span></div>
                              <div>Pending Return: <span className="text-amber-400 font-medium">{remaining} units</span></div>
                              <div>Issued: <span className="text-slate-200">{fmt(req.issuedAt)}</span></div>
                              <div>Due Date: <span className={isOverdue ? "text-red-400 font-bold" : "text-emerald-400"}>{fmt(req.expectedReturnDate)}</span></div>
                            </div>

                            {req.fineAmount > 0 && (
                              <div className="mt-2 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg inline-block">
                                Late Fine accrued: ₹{req.fineAmount}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-3">
                            <StatusBadge status={req.status} />
                            {remaining > 0 && req.status !== 'pending_return' && (
                              <button
                                onClick={() => handleReturnClick(req)}
                                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                              >
                                ↩️ Return Item
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Request History */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3">Request History</h3>
              {equipHistory.length === 0 ? (
                <div className="card p-6 text-center text-slate-500 text-sm">
                  No history found.
                </div>
              ) : (
                <div className="space-y-3">
                  {equipHistory.map((req) => (
                    <div key={req._id} className="card p-4 bg-slate-900/40 border border-slate-800/80">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span>{req.equipmentId?.icon || '🎯'}</span>
                          <h4 className="text-white font-medium text-sm">{req.equipmentId?.name}</h4>
                          <span className="text-xs text-slate-500">• Qty: {req.quantity}</span>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                      
                      <div className="flex flex-wrap justify-between items-center mt-3 pt-2.5 border-t border-slate-800/60 text-xs text-slate-500">
                        <div>Requested: {fmt(req.createdAt)}</div>
                        {req.returnedAt && <div>Returned: {fmt(req.returnedAt)}</div>}
                        {req.rejectionReason && <div className="text-red-400">Rejected: {req.rejectionReason}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )
      )}

      {/* Return Modal */}
      {returnModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReturnModalOpen(false)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                  {selectedReq.equipmentId?.icon || '🎯'}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Return {selectedReq.equipmentId?.name}</h2>
                  <p className="text-xs text-slate-500">
                    Remaining to return: {selectedReq.quantity - (selectedReq.returnedQuantity || 0)} units
                  </p>
                </div>
              </div>
              <button onClick={() => setReturnModalOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity to Return</label>
                <input
                  type="number"
                  className="input-field"
                  min={1}
                  max={selectedReq.quantity - (selectedReq.returnedQuantity || 0)}
                  value={returnQty}
                  onChange={e => setReturnQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Item Condition</label>
                <select
                  className="input-field"
                  value={returnCondition}
                  onChange={e => setReturnCondition(e.target.value)}
                  required
                >
                  <option value="good">Good (No damage)</option>
                  <option value="damaged">Damaged (Scratched/Broken)</option>
                  <option value="lost">Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Condition Notes / Remarks</label>
                <textarea
                  className="input-field h-20 resize-none py-2"
                  placeholder="Describe condition of the returned items..."
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReturnModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submittingReturn}>
                  {submittingReturn ? 'Submitting...' : '↩️ Submit Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Release Facility Modal */}
      {releaseModalOpen && selectedFacilityReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setReleaseModalOpen(false)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                  {selectedFacilityReq.sportId?.icon || '🏟️'}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Release Facility</h2>
                  <p className="text-xs text-slate-500">
                    {selectedFacilityReq.sportId?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setReleaseModalOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleReleaseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Remarks (Optional)</label>
                <textarea
                  className="input-field h-20 resize-none py-2"
                  placeholder="Any remarks about the facility condition..."
                  value={releaseRemarks}
                  onChange={e => setReleaseRemarks(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setReleaseModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submittingRelease}>
                  {submittingRelease ? 'Submitting...' : '🔓 End Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

