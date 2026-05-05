import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function EquipmentPage() {
  const { user } = useAuth();
  const addToast = useToast();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // equipment item
  const [form, setForm] = useState({ quantity: 1, purpose: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchEquipment(); }, []);

  const sports = ['all', ...new Set(equipment.map(e => e.sport))];

  const filtered = filter === 'all' ? equipment : equipment.filter(e => e.sport === filter);

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/equipment/request', {
        equipmentId: modal._id,
        quantity: Number(form.quantity),
        purpose: form.purpose,
      });
      addToast(`Equipment request submitted for ${modal.name}!`, 'success');
      setModal(null);
      setForm({ quantity: 1, purpose: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Request failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-white">Equipment</h1>
        <p className="text-slate-400 mt-1">Borrow sports equipment for your activity</p>
      </div>

      {/* Sport filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {sports.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
              filter === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}>
            {s === 'all' ? 'All Equipment' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => {
            const availPct = item.totalQuantity > 0 ? Math.round((item.availableQuantity / item.totalQuantity) * 100) : 0;
            const isAvail = item.availableQuantity > 0;
            return (
              <div key={item._id} className="card-hover p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                    {item.icon || '🎯'}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    isAvail ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                  }`}>
                    {isAvail ? `${item.availableQuantity} left` : 'Out of stock'}
                  </span>
                </div>

                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{item.sport}</div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Stock: {item.availableQuantity}/{item.totalQuantity}</span>
                    <span>{availPct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      availPct > 60 ? 'bg-emerald-500' : availPct > 30 ? 'bg-amber-500' : 'bg-red-500'
                    }`} style={{ width: `${availPct}%` }} />
                  </div>
                </div>

                <button onClick={() => { setModal(item); setForm({ quantity: 1, purpose: '' }); }}
                  disabled={!isAvail}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isAvail ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}>
                  {isAvail ? '🎯 Request' : '⛔ Unavailable'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Request Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">{modal.icon || '🎯'}</div>
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Request {modal.name}</h2>
                  <p className="text-xs text-slate-500">{modal.availableQuantity} units available</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                <input type="number" className="input-field" min={1} max={modal.availableQuantity}
                  value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
                <p className="text-xs text-slate-500 mt-1">Max: {modal.availableQuantity}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Purpose (optional)</label>
                <input type="text" className="input-field" placeholder="e.g. Practice session"
                  value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Submitting...' : '🎯 Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
