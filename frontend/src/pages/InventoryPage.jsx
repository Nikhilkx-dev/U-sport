import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

export default function InventoryPage() {
  const addToast = useToast();
  const [equipment, setEquipment] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | equipment item for edit
  const [form, setForm] = useState({ name: '', sport: '', totalQuantity: '', icon: '🎯' });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchAll = async () => {
    try {
      const [eRes, sRes] = await Promise.all([api.get('/equipment'), api.get('/sports')]);
      setEquipment(eRes.data.data);
      setSports(sRes.data.data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm({ name: '', sport: '', totalQuantity: '', icon: '🎯' }); setModal('add'); };
  const openEdit = (item) => { setForm({ name: item.name, sport: item.sport, totalQuantity: item.totalQuantity, icon: item.icon || '🎯' }); setModal(item); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal === 'add') {
        await api.post('/equipment', { ...form, totalQuantity: Number(form.totalQuantity) });
        addToast('Equipment added!', 'success');
      } else {
        await api.put(`/equipment/${modal._id}`, { ...form, totalQuantity: Number(form.totalQuantity) });
        addToast('Equipment updated!', 'success');
      }
      setModal(null);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment?')) return;
    setDeleting(id);
    try {
      await api.delete(`/equipment/${id}`);
      addToast('Equipment deleted.', 'info');
      fetchAll();
    } catch { addToast('Delete failed.', 'error'); }
    setDeleting(null);
  };

  const icons = ['🏏', '⚽', '🏀', '🏐', '🎾', '🏸', '🏓', '🎯', '♟️', '⛸️', '🏉', '🥊'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Inventory</h1>
          <p className="text-slate-400 mt-1">Manage sports equipment stock</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <span>+</span> Add Equipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Unique Items', value: equipment.length, icon: '📦', color: 'text-indigo-400' },
          { label: 'Total Stock Quantity', value: equipment.reduce((a, e) => a + (e.totalQuantity || 0), 0), icon: '🏷️', color: 'text-slate-300' },
          { label: 'Available Units', value: equipment.reduce((a, e) => a + (e.availableQuantity || 0), 0), icon: '✅', color: 'text-emerald-400' },
          { label: 'Issued / Damaged / Lost', value: `${equipment.reduce((a, e) => a + (e.issuedQuantity || 0), 0)} / ${equipment.reduce((a, e) => a + (e.damagedQuantity || 0), 0)} / ${equipment.reduce((a, e) => a + (e.lostQuantity || 0), 0)}`, icon: '📤', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</span>
            </div>
            <div className="text-sm text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
        </div>
      ) : equipment.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="text-4xl mb-3 opacity-30">📦</div>
          <p className="text-slate-500">No equipment in inventory. Add some!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map(item => {
            const total = item.totalQuantity || 1; // avoid divide by zero
            const availPct = Math.round(((item.availableQuantity || 0) / total) * 100);
            const issuePct = Math.round(((item.issuedQuantity || 0) / total) * 100);
            const dmgPct = Math.round(((item.damagedQuantity || 0) / total) * 100);
            const lostPct = Math.round(((item.lostQuantity || 0) / total) * 100);

            return (
              <div key={item._id} className="card p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-750 flex items-center justify-center text-xl">{item.icon || '🎯'}</div>
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="text-xs text-slate-500">{item.sport}</div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors text-sm">✏️</button>
                    <button onClick={() => handleDelete(item._id)} disabled={deleting === item._id} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                      {deleting === item._id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Multi-segment Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2.5 bg-slate-850 rounded-full overflow-hidden flex border border-slate-800">
                      {item.availableQuantity > 0 && (
                        <div className="h-full bg-emerald-500 animate-pulse-slow" style={{ width: `${availPct}%` }} title={`Available: ${item.availableQuantity} (${availPct}%)`} />
                      )}
                      {item.issuedQuantity > 0 && (
                        <div className="h-full bg-indigo-500" style={{ width: `${issuePct}%` }} title={`Issued: ${item.issuedQuantity} (${issuePct}%)`} />
                      )}
                      {item.damagedQuantity > 0 && (
                        <div className="h-full bg-amber-500" style={{ width: `${dmgPct}%` }} title={`Damaged: ${item.damagedQuantity} (${dmgPct}%)`} />
                      )}
                      {item.lostQuantity > 0 && (
                        <div className="h-full bg-red-600" style={{ width: `${lostPct}%` }} title={`Lost: ${item.lostQuantity} (${lostPct}%)`} />
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span>{availPct}% in stock</span>
                      <span>Total: {item.totalQuantity} units</span>
                    </div>
                  </div>

                  {/* Quantity Breakdown Grid */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] text-center border-t border-slate-850 pt-3">
                    <div>
                      <div className="text-slate-500 mb-0.5">Available</div>
                      <div className="text-emerald-400 font-bold text-xs">{item.availableQuantity || 0}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Issued</div>
                      <div className="text-indigo-400 font-bold text-xs">{item.issuedQuantity || 0}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Damaged</div>
                      <div className="text-amber-400 font-bold text-xs">{item.damagedQuantity || 0}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Lost</div>
                      <div className="text-red-400 font-bold text-xs">{item.lostQuantity || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold text-white">
                {modal === 'add' ? '➕ Add Equipment' : `✏️ Edit ${modal.name}`}
              </h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Equipment Name</label>
                <input type="text" className="input-field" placeholder="e.g. Cricket Bat" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Sport</label>
                <select className="input-field" value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })} required>
                  <option value="">Select Sport</option>
                  {sports.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Quantity</label>
                <input type="number" className="input-field" min={1} value={form.totalQuantity}
                  onChange={e => setForm({ ...form, totalQuantity: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {icons.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm({ ...form, icon: ic })}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${form.icon === ic ? 'bg-indigo-600 border-2 border-indigo-400' : 'bg-slate-800 border border-slate-700 hover:border-slate-500'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Saving...' : modal === 'add' ? 'Add Equipment' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
