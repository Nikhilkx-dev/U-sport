import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

const fmt = (dt) =>
  dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [facilityReqs, setFacilityReqs] = useState([]);
  const [equipReqs, setEquipReqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, eRes] = await Promise.all([
          api.get("/facility/my-requests"),
          api.get("/equipment/my-requests"),
        ]);
        setFacilityReqs(fRes.data?.data || []);
        setEquipReqs(eRes.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const allRequests = [...facilityReqs, ...equipReqs];
  const pending = allRequests.filter(r => ['pending', 'pending_return'].includes(r.status)).length;
  const activeBorrowed = equipReqs.filter(r => 
    ['approved', 'issued', 'pending_return', 'partially_returned', 'overdue'].includes(r.status)
  ).length;

  const overdue = equipReqs.filter(r => 
    r.status === 'overdue' || 
    (['approved', 'issued', 'pending_return', 'partially_returned'].includes(r.status) && 
     r.expectedReturnDate && new Date() > new Date(r.expectedReturnDate))
  ).length;

  // Upcoming approved facility bookings
  const upcomingBookings = facilityReqs
    .filter(r => r.status === 'approved' && new Date(r.endTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  // Recent activity (last 5 across both types)
  const recentActivity = allRequests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">

      {/* Welcome + Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-300 flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-bold text-white">
              Welcome back, <span className="text-indigo-400">{user?.name?.split(' ')[0]}</span> 👋
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-400">
              {user?.rollNumber && <span>🎫 {user.rollNumber}</span>}
              <span>🏛️ {user?.department}</span>
              {user?.course && <span>📚 {user.course}</span>}
              {user?.year && <span>📅 Year {user.year}</span>}
            </div>
          </div>
          <Link to="/profile" className="btn-secondary text-sm py-2 px-4 flex-shrink-0">
            ✏️ Edit Profile
          </Link>
        </div>
      </div>

      {/* Overdue Warning Banner */}
      {!loading && overdue > 0 && (
        <div className="card border border-red-500/40 bg-red-950/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h4 className="text-white font-bold text-sm">Overdue Equipment Return Warning</h4>
              <p className="text-xs text-red-300">You have {overdue} item{overdue > 1 ? 's' : ''} past the expected return date. Please request a return immediately to avoid further fines.</p>
            </div>
          </div>
          <Link to="/my-requests" className="btn-secondary text-xs py-1.5 px-3 border-red-500/30 hover:bg-red-500/10 text-red-200">
            Return Items Now
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: allRequests.length, icon: '📋', color: 'text-indigo-400' },
          { label: 'Borrowed Items', value: activeBorrowed, icon: '📤', color: 'text-blue-400' },
          { label: 'Overdue Returns', value: overdue, icon: '⚠️', color: overdue > 0 ? 'text-rose-500 font-bold' : 'text-slate-400' },
          { label: 'Pending Action', value: pending, icon: '⏳', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-3xl font-bold ${s.color}`}>
                {loading ? '—' : s.value}
              </span>
            </div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { to: '/sports', icon: '🏟️', label: 'Book a Facility', desc: 'Browse available sports facilities' },
              { to: '/equipment', icon: '🎯', label: 'Borrow Equipment', desc: 'Request sports equipment' },
              { to: '/my-requests', icon: '📋', label: 'View All Requests', desc: 'Track your facility & equipment requests' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 group">
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{a.label}</div>
                  <div className="text-xs text-slate-500">{a.desc}</div>
                </div>
                <span className="text-slate-600 group-hover:text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">Upcoming Bookings</h2>
            <Link to="/my-requests" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : upcomingBookings.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              <div className="text-2xl mb-2 opacity-30">📅</div>
              No upcoming bookings
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map(r => (
                <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-lg">{r.sportId?.icon || '🏟️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{r.sportId?.name}</div>
                    <div className="text-xs text-slate-500">{fmt(r.startTime)}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-white">Recent Activity</h2>
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
        ) : recentActivity.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            <div className="text-2xl mb-2 opacity-30">📋</div>
            No activity yet. Start by booking a facility!
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(r => (
              <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <span className="text-lg">{r.sportId?.icon || r.equipmentId?.icon || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">
                    {r.sportId?.name || r.equipmentId?.name || 'Request'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.purpose ? r.purpose : r.quantity ? `Qty: ${r.quantity}` : '—'} • {fmt(r.createdAt)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
