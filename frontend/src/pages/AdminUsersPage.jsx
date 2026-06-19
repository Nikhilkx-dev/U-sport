import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../components/Toast';

const ROLES = ['student', 'faculty', 'vendor', 'admin'];
const ROLE_COLORS = {
  student: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  faculty: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  vendor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  admin: 'bg-red-500/20 text-red-300 border-red-500/30',
};
const ROLE_ICONS = { student: '🎓', faculty: '👨‍🏫', vendor: '🏪', admin: '🛡️' };

export default function AdminUsersPage() {
  const addToast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [acting, setActing] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data.data);
    } catch (err) {
      addToast('Failed to load users', 'error');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleRoleChange = async (userId, newRole) => {
    setActing(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      addToast(`Role updated to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
    setActing(null);
  };

  const handleDelete = async (userId) => {
    setActing(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      addToast('User deleted', 'info');
      setDeleteModal(null);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
    setActing(null);
  };

  const handleCleanup = async () => {
    try {
      const res = await api.post('/admin/cleanup-unverified');
      addToast(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      addToast('Cleanup failed', 'error');
    }
  };

  const counts = {
    all: users.length,
    student: users.filter(u => u.role === 'student').length,
    faculty: users.filter(u => u.role === 'faculty').length,
    vendor: users.filter(u => u.role === 'vendor').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-1">Manage roles, verify users, and maintain accounts</p>
        </div>
        <button onClick={handleCleanup} className="btn-danger text-sm">
          🧹 Cleanup Unverified
        </button>
      </div>

      {/* Role filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {['all', ...ROLES].map(role => (
          <button key={role} onClick={() => setRoleFilter(role)}
            className={`p-3 rounded-xl border text-left transition-all ${
              roleFilter === role ? 'ring-2 ring-indigo-500/50 bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}>
            <div className="flex items-center justify-between">
              <span className="text-lg">{role === 'all' ? '👥' : ROLE_ICONS[role]}</span>
              <span className="font-display text-xl font-bold text-indigo-400">{counts[role] || 0}</span>
            </div>
            <div className="text-xs text-slate-400 capitalize mt-1">{role === 'all' ? 'All Users' : role}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input className="input-field pl-9 py-2.5 text-sm" placeholder="Search by name, email, or roll number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary text-sm">Search</button>
      </form>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <div className="card py-16 text-center text-slate-500">No users found.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-medium">User</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Department</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Role</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Verified</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Joined</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-sm font-bold text-indigo-300">
                          {u.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-white">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">{u.department}</td>
                    <td className="p-4">
                      <select
                        value={u.role}
                        onChange={e => handleRoleChange(u._id, e.target.value)}
                        disabled={acting === u._id}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer bg-transparent ${ROLE_COLORS[u.role]}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_ICONS[r]} {r}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold ${u.isEmailVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                        {u.isEmailVerified ? '✅' : '❌'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => setDeleteModal(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteModal(null)} />
          <div className="relative w-full max-w-md card p-6 shadow-2xl">
            <h2 className="font-display text-xl font-bold text-white mb-2">Delete User</h2>
            <p className="text-sm text-slate-400 mb-4">
              Are you sure you want to delete <span className="text-white font-semibold">{deleteModal.name}</span> ({deleteModal.email})?
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleDelete(deleteModal._id)} className="btn-danger flex-1" disabled={acting === deleteModal._id}>
                {acting === deleteModal._id ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
