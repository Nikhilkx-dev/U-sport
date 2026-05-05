
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
      addToast('Equipment approved 🎉', 'success');
    },
    equipment_rejected: () => {
      fetchAll(true);
      addToast('Equipment rejected ❌', 'error');
    },
  });

  const EmptyState = ({ text }) => (
    <div className="card py-16 flex flex-col items-center gap-3 text-center">
      <div className="text-4xl opacity-30">📋</div>
      <p className="text-slate-500">{text}</p>
    </div>
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
                ? 'bg-indigo-600 text-white'
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
          <div className="space-y-3">
            {facilityReqs.map((req) => (
              <div key={req._id} className="card p-5">

                {/* Title */}
                <div className="flex justify-between items-center">
                  <h2 className="text-white font-semibold">
                    {req.sportId?.name || "Sport"}
                  </h2>
                  <StatusBadge status={req.status} />
                </div>

                {/* Time */}
                <div className="text-sm text-slate-400 mt-2">
                  {fmt(req.startTime)} → {fmt(req.endTime)}
                </div>

                {/* Purpose */}
                <div className="text-xs text-slate-500 mt-1">
                  {req.purpose}
                </div>

                {/* Rejection */}
                {req.rejectionReason && (
                  <div className="text-xs text-red-400 mt-2">
                    Reason: {req.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        equipReqs.length === 0 ? (
          <EmptyState text="No equipment requests yet." />
        ) : (
          <div className="space-y-3">
            {equipReqs.map((req) => (
              <div key={req._id} className="card p-5">

                <div className="flex justify-between items-center">
                  <h2 className="text-white font-semibold">
                    {req.equipmentId?.name}
                  </h2>
                  <StatusBadge status={req.status} />
                </div>

                <div className="text-sm text-slate-400 mt-2">
                  Qty: {req.quantity}
                </div>

                {req.issuedAt && (
                  <div className="text-xs text-slate-500">
                    Issued: {fmt(req.issuedAt)}
                  </div>
                )}

                {req.returnedAt && (
                  <div className="text-xs text-slate-500">
                    Returned: {fmt(req.returnedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

