import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });

  useEffect(() => {
    // TODO: Phase 2 — connect to vendor-specific APIs
    // For now, show placeholder stats
    const timer = setTimeout(() => {
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">
          Vendor Dashboard <span className="text-orange-400">🏪</span>
        </h1>
        <p className="text-slate-400 mt-1">Welcome, {user?.name} — Manage your vendor operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Products', value: stats.totalProducts, icon: '📦', color: 'text-indigo-400' },
          { label: 'Total Orders', value: stats.totalOrders, icon: '🛒', color: 'text-emerald-400' },
          { label: 'Pending Orders', value: stats.pendingOrders, icon: '⏳', color: 'text-amber-400' },
          { label: 'Revenue (₹)', value: stats.revenue.toLocaleString('en-IN'), icon: '💰', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-3xl font-bold ${s.color}`}>{loading ? '—' : s.value}</span>
            </div>
            <div className="text-sm text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { icon: '📦', label: 'Manage Products', desc: 'Add, edit, or remove products', disabled: true },
              { icon: '🛒', label: 'View Orders', desc: 'Track and fulfill orders', disabled: true },
              { icon: '📊', label: 'Sales Analytics', desc: 'View revenue and performance', disabled: true },
            ].map((a, i) => (
              <div key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                  a.disabled
                    ? 'bg-slate-800/30 border-slate-800 opacity-60 cursor-not-allowed'
                    : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 cursor-pointer'
                }`}>
                <span className="text-xl">{a.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-200">{a.label}</div>
                  <div className="text-xs text-slate-500">{a.desc}</div>
                </div>
                {a.disabled && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">Phase 2</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold text-white mb-4">Account Info</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 mt-0.5">✅</span>
              <div>
                <div className="text-sm font-semibold text-emerald-300">Vendor Status: Active</div>
                <div className="text-xs text-slate-500 mt-0.5">Your vendor account is verified and operational</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-indigo-400 mt-0.5">🏪</span>
              <div>
                <div className="text-sm font-semibold text-indigo-300">Vendor Portal</div>
                <div className="text-xs text-slate-500 mt-0.5">Product management and order fulfillment coming in Phase 2</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
              {[
                ['Name', user?.name],
                ['Email', user?.email],
                ['Department', user?.department],
                ['Role', 'Vendor'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-1 text-xs">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-300 font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2 Notice */}
      <div className="card p-6 text-center">
        <div className="text-4xl mb-3 opacity-40">🚧</div>
        <h3 className="text-lg font-bold text-white mb-2">Advanced Features Coming Soon</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Product listings, order management, sales analytics, and revenue tracking
          will be available in Phase 2 of the USport upgrade.
        </p>
      </div>
    </div>
  );
}
