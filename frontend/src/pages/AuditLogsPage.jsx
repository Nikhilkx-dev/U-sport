import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const ACTION_COLORS = {
  issued: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  returned: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  damaged: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  lost: 'bg-red-500/20 text-red-300 border-red-500/30',
  stock_adjusted: 'bg-slate-500/20 text-slate-350 border-slate-500/30',
};

const ACTION_LABELS = {
  issued: '📤 Issued',
  returned: '↩️ Returned',
  damaged: '🔨 Damaged',
  lost: '❌ Lost',
  stock_adjusted: '⚙️ Stock Adjusted',
};

export default function AuditLogsPage() {
  const addToast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns/audit-logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useSocket({
    return_approved: () => fetchLogs(),
    equipment_issued: () => fetchLogs(),
    equipment_returned: () => fetchLogs(),
  });

  const filteredLogs = logs.filter(log => {
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSearch = search
      ? log.equipmentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.equipmentId?.sport?.toLowerCase().includes(search.toLowerCase()) ||
        log.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.performedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.notes?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesAction && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Inventory Audit Logs</h1>
        <p className="text-slate-400 mt-1">Timeline of all equipment issues, returns, and inventory state adjustments</p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search logs..."
            className="input-field pl-9 py-2.5 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'issued', 'returned', 'damaged', 'lost', 'stock_adjusted'].map(act => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${
                actionFilter === act
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
              }`}
            >
              {act === 'all' ? 'All Activities' : ACTION_LABELS[act] || act}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Timeline */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="card py-20 text-center">
          <div className="text-4xl mb-3 opacity-30">📜</div>
          <p className="text-slate-500">No inventory audit logs found.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6 animate-fade-in py-2">
          {filteredLogs.map(log => {
            const colorClass = ACTION_COLORS[log.action] || 'bg-slate-800 text-slate-400';
            const actionLabel = ACTION_LABELS[log.action] || log.action;

            return (
              <div key={log._id} className="relative group">
                {/* Timeline Dot Icon */}
                <div className="absolute -left-10 top-1.5 w-7 h-7 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs group-hover:border-indigo-500 transition-colors shadow-md">
                  {log.action === 'issued' ? '📤' : log.action === 'returned' ? '↩️' : log.action === 'damaged' ? '🔨' : log.action === 'lost' ? '❌' : '⚙️'}
                </div>

                {/* Log Card */}
                <div className="card p-5 hover:border-slate-750 transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${colorClass}`}>
                        {actionLabel}
                      </span>
                      <span className="text-slate-500 text-xs">{fmt(log.createdAt)}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      Authorized by: <span className="font-semibold text-slate-200">{log.performedBy?.name || 'Admin'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{log.equipmentId?.icon || '🎯'}</span>
                        <span className="font-bold text-white text-base">{log.equipmentId?.name || 'Deleted Equipment'}</span>
                        <span className="text-xs text-slate-500">({log.equipmentId?.sport})</span>
                      </div>
                      
                      <div className="text-sm text-slate-350 mt-1.5 font-medium">
                        Quantity affected: <span className="text-indigo-400 font-bold">{log.quantity} unit{log.quantity > 1 ? 's' : ''}</span>
                        {log.userId && (
                          <> for student: <span className="text-slate-200">{log.userId.name} {log.userId.rollNumber ? `(${log.userId.rollNumber})` : ''}</span></>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-500 italic mt-1.5 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-900">
                          "{log.notes}"
                        </p>
                      )}
                    </div>

                    {/* Snapshot state transition */}
                    {(log.previousState || log.newState) && (
                      <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 text-[10px] space-y-1.5 min-w-[220px]">
                        <div className="text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-850 pb-1">
                          Inventory State Transition
                        </div>
                        <div className="grid grid-cols-3 gap-x-3 text-right">
                          <span className="text-left text-slate-500">Metric</span>
                          <span className="text-slate-400 font-medium">Before</span>
                          <span className="text-indigo-400 font-bold">After</span>

                          {/* Available */}
                          {log.previousState?.availableQuantity !== undefined && (
                            <>
                              <span className="text-left text-slate-400">Available:</span>
                              <span className="text-slate-400">{log.previousState.availableQuantity}</span>
                              <span className="text-indigo-400 font-bold">{log.newState?.availableQuantity}</span>
                            </>
                          )}

                          {/* Issued */}
                          {log.previousState?.issuedQuantity !== undefined && (
                            <>
                              <span className="text-left text-slate-400">Issued:</span>
                              <span className="text-slate-400">{log.previousState.issuedQuantity}</span>
                              <span className="text-indigo-400 font-bold">{log.newState?.issuedQuantity}</span>
                            </>
                          )}

                          {/* Damaged */}
                          {log.previousState?.damagedQuantity !== undefined && (
                            <>
                              <span className="text-left text-slate-400">Damaged:</span>
                              <span className="text-slate-400">{log.previousState.damagedQuantity}</span>
                              <span className="text-indigo-400 font-bold">{log.newState?.damagedQuantity}</span>
                            </>
                          )}

                          {/* Lost */}
                          {log.previousState?.lostQuantity !== undefined && (
                            <>
                              <span className="text-left text-slate-400">Lost:</span>
                              <span className="text-slate-400">{log.previousState.lostQuantity}</span>
                              <span className="text-indigo-400 font-bold">{log.newState?.lostQuantity}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
