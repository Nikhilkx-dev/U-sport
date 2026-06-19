import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm">
        <p className="text-white font-semibold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setData(res.data.data);
      } catch (err) {
        console.error('Admin stats error:', err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const c = data?.counts || {};

  const roleData = [
    { name: 'Students', value: c.totalStudents || 0 },
    { name: 'Faculty', value: c.totalFaculty || 0 },
    { name: 'Vendors', value: c.totalVendors || 0 },
  ].filter(d => d.value > 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Admin Dashboard <span className="text-red-400">🛡️</span>
        </h1>
        <p className="text-slate-400 mt-1">Welcome, {user?.name} — Full system overview</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: c.totalUsers, icon: '👥', color: 'text-indigo-400' },
          { label: 'Students', value: c.totalStudents, icon: '🎓', color: 'text-blue-400' },
          { label: 'Faculty', value: c.totalFaculty, icon: '👨‍🏫', color: 'text-purple-400' },
          { label: 'Vendors', value: c.totalVendors, icon: '🏪', color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-3xl font-bold ${s.color}`}>{loading ? '—' : (s.value || 0)}</span>
            </div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Request Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Bookings", value: c.todayBookings, icon: '📅', color: 'text-indigo-400' },
          { label: 'Pending Facility', value: c.pendingFacility, icon: '⏳', color: 'text-amber-400' },
          { label: 'Pending Equipment', value: c.pendingEquipment, icon: '🎯', color: 'text-orange-400' },
          { label: 'Unverified Users', value: c.unverifiedUsers, icon: '⚠️', color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-3xl font-bold ${s.color}`}>{loading ? '—' : (s.value || 0)}</span>
            </div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Return & Inventory Stats */}
      <div className="mb-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Return & Inventory Tracking</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending Returns', value: c.pendingReturns, icon: '↩️', color: 'text-amber-400', to: '/admin/returns' },
            { label: 'Overdue Returns', value: c.overdueReturns, icon: '⚠️', color: (c.overdueReturns || 0) > 0 ? 'text-rose-500 font-bold' : 'text-slate-400', to: '/admin/issued-items' },
            { label: 'Total Issued Items', value: c.totalIssued, icon: '📤', color: 'text-indigo-400', to: '/admin/issued-items' },
            { label: 'Damaged Stock', value: c.totalDamaged, icon: '🔨', color: 'text-red-400', to: '/admin/inventory' },
          ].map(s => (
            <Link key={s.label} to={s.to} className="stat-card hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{s.icon}</span>
                <span className={`font-display text-3xl font-bold ${s.color}`}>{loading ? '—' : (s.value || 0)}</span>
              </div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Facility Usage Bar Chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Facility Usage</h2>
          {loading ? (
            <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data?.usageData || []}>
                <CartesianGrid stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="available" fill="#22c55e" name="Available" radius={[4, 4, 0, 0]} />
                <Bar dataKey="used" fill="#6366f1" name="In Use" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Distribution Pie */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">User Distribution</h2>
          {loading ? (
            <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
          ) : roleData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No users yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={roleData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Admin Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { to: '/admin/users', icon: '👥', label: 'Manage Users', desc: 'View, edit roles, delete users' },
              { to: '/admin/sports', icon: '🏟️', label: 'Manage Sports', desc: 'Add or edit sports facilities' },
              { to: '/admin/returns', icon: '↩️', label: 'Returns Management', desc: 'Review & approve student returns' },
              { to: '/admin/issued-items', icon: '📤', label: 'Issued Items Tracker', desc: 'Check active equipment holdings' },
              { to: '/admin/audit-logs', icon: '📜', label: 'Audit Logs', desc: 'Inspect inventory movement history' },
              { to: '/admin/inventory', icon: '📦', label: 'Inventory Management', desc: 'Inspect & manage equipment stock' },
            ].map(a => (
              <Link key={a.to} to={a.to}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 group">
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-white truncate">{a.label}</div>
                  <div className="text-xs text-slate-500 truncate">{a.desc}</div>
                </div>
                <span className="text-slate-650 group-hover:text-slate-400 pr-1 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Recent Requests</h2>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {(data?.recentFacility || []).slice(0, 4).map(r => (
                <div key={r._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                  <span className="text-lg">{r.sportId?.icon || '🏟️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{r.studentId?.name || 'Student'}</div>
                    <div className="text-xs text-slate-500">{r.sportId?.name} • {r.status}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{r.status}</span>
                </div>
              ))}
              {(!data?.recentFacility || data.recentFacility.length === 0) && (
                <div className="py-6 text-center text-slate-500 text-sm">No recent activity</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
