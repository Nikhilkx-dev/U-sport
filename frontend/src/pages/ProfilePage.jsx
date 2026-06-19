import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const addToast = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    course: user?.course || '',
    year: user?.year || '',
    bio: user?.bio || '',
    department: user?.department || '',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      addToast('Profile updated successfully!', 'success');
      setEditing(false);
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      course: user?.course || '',
      year: user?.year || '',
      bio: user?.bio || '',
      department: user?.department || '',
    });
    setEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My Profile</h1>
          <p className="text-slate-400 mt-1">Manage your account details</p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary text-sm">
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border-2 border-indigo-500/30 flex items-center justify-center text-4xl font-bold text-indigo-300">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user?.role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                user?.role === 'faculty' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                user?.role === 'vendor' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}>
                {user?.role === 'admin' ? '🛡️' : user?.role === 'faculty' ? '👨‍🏫' : user?.role === 'vendor' ? '🏪' : '🎓'} {user?.role}
              </span>
              {user?.isEmailVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✅ Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input type="text" className="input-field" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                <input type="text" className="input-field" value={form.department}
                  onChange={e => setForm({ ...form, department: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                <input type="text" className="input-field" placeholder="+91 ..." value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Course</label>
                <input type="text" className="input-field" placeholder="e.g. B.Tech CSE" value={form.course}
                  onChange={e => setForm({ ...form, course: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Year / Semester</label>
                <input type="text" className="input-field" placeholder="e.g. 3rd Year" value={form.year}
                  onChange={e => setForm({ ...form, year: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
              <textarea className="input-field resize-none" rows={3} placeholder="Tell us about yourself..."
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} maxLength={300} />
              <p className="text-xs text-slate-500 mt-1">{form.bio?.length || 0}/300</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={handleCancel} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Email', value: user?.email, icon: '📧' },
              { label: 'Department', value: user?.department, icon: '🏛️' },
              { label: 'Roll Number', value: user?.rollNumber || '—', icon: '🎫' },
              { label: 'Phone', value: user?.phone || '—', icon: '📱' },
              { label: 'Course', value: user?.course || '—', icon: '📚' },
              { label: 'Year', value: user?.year || '—', icon: '📅' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">{item.icon} {item.label}</div>
                <div className="text-sm font-medium text-slate-200">{item.value}</div>
              </div>
            ))}
            {user?.bio && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="text-xs text-slate-500 mb-1">📝 Bio</div>
                <div className="text-sm text-slate-200">{user.bio}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h3 className="font-display text-lg font-bold text-white mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-500">Role</span>
            <span className="text-slate-200 capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-800/60">
            <span className="text-slate-500">Email Verified</span>
            <span className={user?.isEmailVerified ? 'text-emerald-400' : 'text-red-400'}>
              {user?.isEmailVerified ? '✅ Verified' : '❌ Not Verified'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Member Since</span>
            <span className="text-slate-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
