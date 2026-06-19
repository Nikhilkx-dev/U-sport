import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Step 1 vs Step 2 state
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-select role if passed in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'admin' || roleParam === 'student') {
      setSelectedRole(roleParam);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(form.email, form.password);

      // OTP sent successfully → go to verify page
      navigate('/verify-otp', {
        state: {
          email: form.email,
          message: data.message
        }
      });

    } catch (err) {
      const resData = err.response?.data;

      // Handle unverified email — redirect to OTP verification
      if (resData?.requiresVerification) {
        navigate('/verify-otp', {
          state: {
            email: resData.email || form.email,
            message: resData.message
          }
        });
        return;
      }

      setError(resData?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        
        {/* Step 1: Role Selection */}
        {!selectedRole && (
          <div className="card p-8 glow-indigo text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-500/30 mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Welcome to U-SPORT</h1>
            <p className="text-slate-400 text-sm mb-8">Please select your portal to continue</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => setSelectedRole('student')}
                className="w-full group relative overflow-hidden rounded-2xl p-6 bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 text-left flex items-center gap-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  🎓
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">Student Portal</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Access facilities and equipment</p>
                </div>
                <div className="ml-auto text-slate-500 group-hover:text-indigo-400 transition-colors">→</div>
              </button>

              <button 
                onClick={() => setSelectedRole('admin')}
                className="w-full group relative overflow-hidden rounded-2xl p-6 bg-slate-800/50 border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 text-left flex items-center gap-4"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  🛡️
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">Admin Portal</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Manage the sports system</p>
                </div>
                <div className="ml-auto text-slate-500 group-hover:text-emerald-400 transition-colors">→</div>
              </button>
            </div>

            <p className="text-center text-sm text-slate-500 mt-8">
              New to U-SPORT?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                Register here
              </Link>
            </p>
          </div>
        )}

        {/* Step 2: Login Form */}
        {selectedRole && (
          <div className={`card p-8 animate-slide-up ${selectedRole === 'admin' ? 'glow-emerald' : 'glow-indigo'}`}>
            
            <button 
              onClick={() => setSelectedRole(null)}
              className="text-xs font-medium text-slate-400 hover:text-white mb-6 flex items-center gap-1 transition-colors"
            >
              ← Back to roles
            </button>

            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-xl mb-4 ${
                selectedRole === 'admin' 
                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/20' 
                  : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-indigo-500/20'
              }`}>
                <span className="text-2xl">{selectedRole === 'admin' ? '🛡️' : '🎓'}</span>
              </div>
              <h1 className="font-display text-2xl font-bold text-white">
                {selectedRole === 'admin' ? 'Admin Portal' : 'Student Portal'}
              </h1>
              <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 animate-fade-in">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder={selectedRole === 'admin' ? "nikhilkr20062@gmail.com" : "student@chitkara.edu.in"}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className={`w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                  selectedRole === 'admin'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30 border border-emerald-500/50'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30 border border-indigo-500/50'
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Sending OTP...
                  </>
                ) : 'Continue with Email'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
              <p className="text-xs text-slate-500 mb-2 font-medium">Demo Credentials</p>
              {selectedRole === 'student' ? (
                <div className="text-xs text-slate-400">student@demo.com / demo123</div>
              ) : (
                <div className="text-xs text-slate-400">nikhilkr20062@gmail.com / Admin@12345</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
