import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BookingModal({ sport, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setError('End time must be after start time.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/facility/request', {
        sportId: sport._id,
        startTime: form.startTime,
        endTime: form.endTime,
        purpose: form.purpose,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.response?.data?.maintenance) {
        setError('🔧 Booking unavailable during maintenance (4 PM – 5 PM IST).');
      } else {
        setError(err.response?.data?.message || 'Failed to submit request.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Min datetime = now (local)
  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card p-6 animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
              {sport.icon}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-white">Book {sport.name}</h2>
              <p className="text-xs text-slate-500">{sport.availableFacilities} facility available</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">✕</button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Read-only info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <div className="input-field py-2 text-sm text-slate-300 cursor-default">{user?.name}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Roll Number</label>
            <div className="input-field py-2 text-sm text-slate-300 cursor-default">{user?.rollNumber || 'N/A'}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Time</label>
              <input type="datetime-local" className="input-field text-sm" value={form.startTime} min={nowLocal()}
                onChange={e => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Time</label>
              <input type="datetime-local" className="input-field text-sm" value={form.endTime} min={form.startTime || nowLocal()}
                onChange={e => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Purpose</label>
            <textarea className="input-field text-sm resize-none" rows={3} placeholder="e.g. Practice session, tournament, friendly match..."
              value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required maxLength={300} />
            <p className="text-xs text-slate-600 mt-1">{form.purpose.length}/300</p>
          </div>

          {/* Maintenance warning */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
            <span className="mt-0.5">⚠️</span>
            <span>Booking is not available during <strong>4:00 PM – 5:00 PM IST</strong> daily maintenance window.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Submitting...' : '📋 Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
