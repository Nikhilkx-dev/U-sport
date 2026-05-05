import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const addToast = useToast();
  const [stats, setStats] = useState({
    pendingFacility: 0, approvedFacility: 0,
    pendingEquipment: 0, approvedEquipment: 0,
    totalSports: 0, totalEquipment: 0,
  });
  const [recentFacility, setRecentFacility] = useState([]);
  const [recentEquipment, setRecentEquipment] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [fRes, eRes, sRes, eqRes] = await Promise.all([
        api.get('/facility/requests'),
        api.get('/equipment/requests'),
        api.get('/sports'),
        api.get('/equipment'),
      ]);
      const fReqs = fRes.data.data;
      const eReqs = eRes.data.data;
      setStats({
        pendingFacility: fReqs.filter(r => r.status === 'pending').length,
        approvedFacility: fReqs.filter(r => r.status === 'approved').length,
        pendingEquipment: eReqs.filter(r => r.status === 'pending').length,
        approvedEquipment: eReqs.filter(r => r.status === 'approved').length,
        totalSports: sRes.data.data.length,
        totalEquipment: eqRes.data.data.length,
      });
      setRecentFacility(fReqs.filter(r => r.status === 'pending').slice(0, 4));
      setRecentEquipment(eReqs.filter(r => r.status === 'pending').slice(0, 4));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useSocket({
    facility_requested: () => { fetchData(); addToast('New facility request!', 'info'); },
    equipment_requested: () => { fetchData(); addToast('New equipment request!', 'info'); },
    facility_approved: fetchData,
    facility_rejected: fetchData,
    equipment_issued: fetchData,
    equipment_rejected: fetchData,
  });

  const totalPending = stats.pendingFacility + stats.pendingEquipment;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Welcome, <span className="text-indigo-400">{user?.name?.split(' ')[0]}</span> 👨‍🏫
        </h1>
        <p className="text-slate-400 mt-1">Faculty Overview — Chitkara University Sports Management</p>
      </div>

      {totalPending > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6">
          <span className="text-xl animate-pulse-slow">🔔</span>
          <span className="flex-1 text-sm font-semibold">
            {totalPending} request{totalPending > 1 ? 's' : ''} awaiting approval
            {stats.pendingFacility > 0 && ` (${stats.pendingFacility} facility${stats.pendingEquipment > 0 ? `, ${stats.pendingEquipment} equipment` : ''})`}
          </span>
          <Link to="/faculty/facility-requests" className="text-xs font-semibold underline hover:text-amber-300">Review →</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Facility', value: stats.pendingFacility, icon: '⏳', color: 'text-amber-400', link: '/faculty/facility-requests' },
          { label: 'Active Bookings', value: stats.approvedFacility, icon: '✅', color: 'text-emerald-400', link: '/faculty/facility-requests' },
          { label: 'Pending Equipment', value: stats.pendingEquipment, icon: '🎯', color: 'text-orange-400', link: '/faculty/equipment-requests' },
          { label: 'Equipment Issued', value: stats.approvedEquipment, icon: '📤', color: 'text-blue-400', link: '/faculty/equipment-requests' },
          { label: 'Total Sports', value: stats.totalSports, icon: '🏟️', color: 'text-indigo-400', link: '/faculty/analytics' },
          { label: 'Equipment Types', value: stats.totalEquipment, icon: '📦', color: 'text-violet-400', link: '/faculty/inventory' },
        ].map(s => (
          <Link key={s.label} to={s.link} className="stat-card hover:border-slate-700 transition-colors group">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-3xl font-bold ${s.color}`}>{loading ? '—' : s.value}</span>
            </div>
            <div className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick actions */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/faculty/facility-requests', icon: '📋', label: 'Review Facility Requests', badge: stats.pendingFacility },
              { to: '/faculty/equipment-requests', icon: '🎯', label: 'Review Equipment Requests', badge: stats.pendingEquipment },
              { to: '/faculty/inventory', icon: '📦', label: 'Manage Equipment Inventory', badge: 0 },
              { to: '/faculty/analytics', icon: '📊', label: 'View Analytics Dashboard', badge: 0 },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 group">
                <span className="text-lg">{a.icon}</span>
                <span className="flex-1 text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{a.label}</span>
                {a.badge > 0 && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">{a.badge}</span>}
                <span className="text-slate-600 group-hover:text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 mt-0.5">✅</span>
              <div><div className="text-sm font-semibold text-emerald-300">System Online</div><div className="text-xs text-slate-500 mt-0.5">All services running</div></div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-amber-400 mt-0.5">🔧</span>
              <div><div className="text-sm font-semibold text-amber-300">Maintenance Window</div><div className="text-xs text-slate-500 mt-0.5">Bookings paused 4:00 PM – 5:00 PM IST daily</div></div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-indigo-400 mt-0.5">⚡</span>
              <div><div className="text-sm font-semibold text-indigo-300">Real-Time Active</div><div className="text-xs text-slate-500 mt-0.5">Requests appear instantly via Socket.IO</div></div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5">
              {[['Logged in as', user?.email], ['Department', user?.department], ['Role', 'Faculty']].map(([k, v]) => (
                <div key={k} className="flex justify-between px-1 text-xs">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-300 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Pending Facilities</h2>
            <Link to="/faculty/facility-requests" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
            : recentFacility.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm"><div className="text-2xl mb-2 opacity-30">📋</div>No pending requests</div>
            ) : (
              <div className="space-y-2">
                {recentFacility.map(r => (
                  <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <span className="text-lg">{r.sportId?.icon || '🏟️'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{r.studentId?.name}</div>
                      <div className="text-xs text-slate-500 truncate">{r.sportId?.name} • {r.purpose}</div>
                    </div>
                    <span className="badge-pending">⏳</span>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Pending Equipment</h2>
            <Link to="/faculty/equipment-requests" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
            : recentEquipment.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm"><div className="text-2xl mb-2 opacity-30">🎯</div>No pending requests</div>
            ) : (
              <div className="space-y-2">
                {recentEquipment.map(r => (
                  <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <span className="text-lg">{r.equipmentId?.icon || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{r.studentId?.name}</div>
                      <div className="text-xs text-slate-500">{r.equipmentId?.name} × {r.quantity}</div>
                    </div>
                    <span className="badge-pending">⏳</span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
