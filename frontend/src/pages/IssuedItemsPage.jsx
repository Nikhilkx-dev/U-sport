import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';

const fmt = (dt) => dt ? new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const fmtDateOnly = (dt) => dt ? new Date(dt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';

export default function IssuedItemsPage() {
  const addToast = useToast();
  const navigate = useNavigate();
  const [issuedItems, setIssuedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [acting, setActing] = useState(null);

  const fetchIssuedItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns/issued');
      setIssuedItems(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load issued items list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuedItems();
  }, []);

  useSocket({
    equipment_issued: () => {
      fetchIssuedItems();
    },
    equipment_returned: () => {
      fetchIssuedItems();
    },
    return_approved: () => {
      fetchIssuedItems();
    },
    return_rejected: () => {
      fetchIssuedItems();
    }
  });

  const handleQuickReturn = async (id) => {
    if (!window.confirm('Are you sure you want to mark this equipment request as returned in Good condition?')) {
      return;
    }

    setActing(id);
    try {
      await api.put(`/equipment/return/${id}`);
      addToast('Equipment marked as returned in Good condition! ↩️', 'success');
      fetchIssuedItems();
    } catch (err) {
      addToast(err.response?.data?.message || 'Quick return failed.', 'error');
    } finally {
      setActing(null);
    }
  };

  // Get unique sports for the filter dropdown
  const sports = ['all', ...new Set(issuedItems.map(item => item.equipmentId?.sport).filter(Boolean))];

  // Calculations
  const totalIssuedQty = issuedItems.reduce((sum, item) => sum + (item.quantity - item.returnedQuantity), 0);
  
  const overdueItems = issuedItems.filter(item => {
    const isOverdue = item.status === 'overdue' || (item.expectedReturnDate && new Date() > new Date(item.expectedReturnDate));
    return isOverdue;
  });
  const overdueCount = overdueItems.reduce((sum, item) => sum + (item.quantity - item.returnedQuantity), 0);

  const uniqueBorrowers = new Set(issuedItems.map(item => item.studentId?._id).filter(Boolean)).size;

  // Filter items
  const filteredItems = issuedItems.filter(item => {
    const remainingQty = item.quantity - item.returnedQuantity;
    if (remainingQty <= 0) return false;

    const matchesSearch = search
      ? item.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.studentId?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
        item.equipmentId?.name?.toLowerCase().includes(search.toLowerCase())
      : true;

    const matchesSport = sportFilter === 'all' || item.equipmentId?.sport === sportFilter;

    const isOverdue = item.status === 'overdue' || (item.expectedReturnDate && new Date() > new Date(item.expectedReturnDate));
    const matchesOverdue = !overdueOnly || isOverdue;

    return matchesSearch && matchesSport && matchesOverdue;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Issued Items</h1>
          <p className="text-slate-400 mt-1">Track all currently issued sports equipment and handle returns</p>
        </div>
        <button
          onClick={() => navigate('/admin/returns')}
          className="btn-secondary flex items-center gap-2 self-start md:self-auto"
        >
          <span>↩️</span> Returns Approval Panel
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-2xl">📤</span>
            <span className="font-display text-3xl font-bold text-indigo-400">
              {loading ? '—' : totalIssuedQty}
            </span>
          </div>
          <div className="text-sm text-slate-500 font-medium">Total Units Currently Issued</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-2xl">⚠️</span>
            <span className={`font-display text-3xl font-bold ${overdueCount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
              {loading ? '—' : overdueCount}
            </span>
          </div>
          <div className="text-sm text-slate-500 font-medium">Overdue Units</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🎓</span>
            <span className="font-display text-3xl font-bold text-emerald-400">
              {loading ? '—' : uniqueBorrowers}
            </span>
          </div>
          <div className="text-sm text-slate-500 font-medium">Active Borrowers</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by student, roll number, equipment..."
            className="input-field pl-10 py-2.5 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 uppercase font-semibold">Sport:</label>
            <select
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              value={sportFilter}
              onChange={e => setSportFilter(e.target.value)}
            >
              {sports.map(sport => (
                <option key={sport} value={sport} className="capitalize">
                  {sport === 'all' ? 'All Sports' : sport}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-850 border border-slate-700/50 hover:bg-slate-800 px-3 py-2 rounded-xl transition-all">
            <input
              type="checkbox"
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
            />
            <span className="text-xs font-semibold text-slate-200">🚨 Show Overdue Only</span>
          </label>
        </div>
      </div>

      {/* List / Table of Issued Items */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="text-4xl mb-3 opacity-30">📤</div>
          <p className="text-slate-500">No active issued items found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {filteredItems.map(item => {
            const remaining = item.quantity - item.returnedQuantity;
            const isOverdue = item.status === 'overdue' || (item.expectedReturnDate && new Date() > new Date(item.expectedReturnDate));

            return (
              <div
                key={item._id}
                className={`card p-5 border ${
                  isOverdue ? 'border-rose-500/20 hover:border-rose-500/40' : 'border-slate-800 hover:border-slate-700'
                } transition-all duration-200`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Left Column: Student Detail */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-300 flex-shrink-0">
                      {item.studentId?.name?.charAt(0).toUpperCase() || '🎓'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-base truncate">{item.studentId?.name}</div>
                      <div className="text-xs text-slate-400 font-medium">
                        {item.studentId?.rollNumber && `${item.studentId.rollNumber} • `}
                        {item.studentId?.department || 'Department Not Specified'}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{item.studentId?.email}</div>
                    </div>
                  </div>

                  {/* Middle Column: Equipment Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0 border-t border-slate-800 lg:border-t-0 pt-4 lg:pt-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-750 flex-shrink-0">
                      {item.equipmentId?.icon || '🎯'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{item.equipmentId?.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-slate-500 bg-slate-850 px-2 py-0.5 rounded-full border border-slate-800">
                          {item.equipmentId?.sport || 'General'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Issued: <span className="font-bold text-indigo-400">{remaining}</span> / {item.quantity} unit{item.quantity > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status, Dates & Action */}
                  <div className="flex flex-wrap lg:flex-nowrap items-center justify-between lg:justify-end gap-6 border-t border-slate-800 lg:border-t-0 pt-4 lg:pt-0 flex-shrink-0">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Issued On:</span>
                        <span className="text-slate-350">{fmtDateOnly(item.issuedAt || item.createdAt)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Expected Due:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-350'}`}>
                          {fmtDateOnly(item.expectedReturnDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={isOverdue ? 'overdue' : item.status} />

                      <button
                        onClick={() => handleQuickReturn(item._id)}
                        disabled={acting === item._id}
                        className="btn-success text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 hover:brightness-110 active:brightness-95 transition-all"
                      >
                        {acting === item._id ? 'Processing...' : '↩️ Quick Return'}
                      </button>
                    </div>
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
