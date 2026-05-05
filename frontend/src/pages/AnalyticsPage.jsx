
import { useState, useEffect } from 'react';
import api from '../services/api';
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
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/sports/analytics');
      setData(res.data?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card py-16 text-center text-slate-500">
        Failed to load analytics.
      </div>
    );
  }

  const pieData =
    data.usageData?.filter(d => d.used > 0).map(d => ({
      name: d.name,
      value: d.used,
    })) || [];

  return (
    <div>

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400">Usage insights</p>
        </div>

        <button
          onClick={() => fetchData(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Today's Bookings", value: data.totalBookingsToday, color: 'text-indigo-400' },
          { label: 'Pending Facility', value: data.pendingFacility, color: 'text-yellow-400' },
          { label: 'Active Bookings', value: data.approvedFacility, color: 'text-green-400' },
          { label: 'Pending Equipment', value: data.pendingEquipment, color: 'text-orange-400' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>
              {s.value}
            </div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Bar */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-white mb-4">Facility Usage</h2>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.usageData || []}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />

              <Bar dataKey="available" fill="#22c55e" />
              <Bar dataKey="used" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="card p-6">
          <h2 className="text-white mb-4">Usage Distribution</h2>

          {pieData.length === 0 ? (
            <div className="text-slate-500 text-center mt-20">
              No usage data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Sports */}
      <div className="card p-6">
        <h2 className="text-white mb-4">Top Sports</h2>

        {data.mostUsed?.length === 0 ? (
          <p className="text-slate-500">No data</p>
        ) : (
          data.mostUsed.map((sport, i) => (
            <div key={sport._id} className="mb-3">

              <div className="flex justify-between text-sm">
                <span>{sport.name}</span>
                <span>
                  {sport.usedFacilities}/{sport.totalFacilities}
                </span>
              </div>

              <div className="h-2 bg-slate-800 rounded mt-1">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${
                      (sport.usedFacilities / sport.totalFacilities) * 100
                    }%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

