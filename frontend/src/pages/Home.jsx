import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '🏟️', title: 'Book Facilities', desc: 'Reserve cricket grounds, basketball courts, badminton halls and more in seconds.' },
  { icon: '🎯', title: 'Borrow Equipment', desc: 'Request sports equipment and track its status from request to return.' },
  { icon: '⚡', title: 'Real-Time Updates', desc: 'Instant notifications when your request is approved or rejected.' },
  { icon: '📊', title: 'Faculty Analytics', desc: 'Comprehensive dashboards for managing all bookings and inventory.' },
  { icon: '🤖', title: 'Smart Chatbot', desc: 'AI assistant to help you find availability and guide the booking process.' },
  { icon: '🔒', title: 'Secure Access', desc: 'Role-based authentication for students and faculty members.' },
];

const sports = [
  { icon: '🏏', name: 'Cricket', count: '3 Grounds' },
  { icon: '⚽', name: 'Football', count: '2 Grounds' },
  { icon: '🏀', name: 'Basketball', count: '4 Courts' },
  { icon: '🏸', name: 'Badminton', count: '6 Courts' },
  { icon: '🎾', name: 'Tennis', count: '2 Courts' },
  { icon: '🏐', name: 'Volleyball', count: '2 Courts' },
  { icon: '♟️', name: 'Chess', count: '4 Boards' },
  { icon: '🏓', name: 'Table Tennis', count: '3 Tables' },
  { icon: '🎯', name: 'Carrom', count: '5 Tables' },
  { icon: '🏓', name: 'Pickleball', count: '6 Courts' },
  { icon: '⛸️', name: 'Skating', count: '1 Track' },
  { icon: '🏅', name: 'And More', count: 'Coming Soon' },
];

export default function Home() {
  const { user } = useAuth();
  if (user) return <Navigate to={user.role === 'faculty' ? '/faculty' : '/dashboard'} replace />;

  return (
    <div className="min-h-screen gradient-bg">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5 border-b border-slate-800/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30">⚡</div>
          <div>
            <span className="font-display text-xl font-bold text-white">U-SPORT</span>
            <span className="text-slate-500 text-xs ml-2 hidden sm:inline">Chitkara University</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">Sign In</Link>
          <Link to="/register" className="btn-primary text-sm py-2">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-6 lg:px-16 pt-24 pb-20 text-center overflow-hidden">
        {/* BG glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-slow"></span>
            Chitkara University Sports Management
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Book Sports Facilities{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Instantly</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in">
            The all-in-one platform for Chitkara University students and faculty to manage sports facility bookings, equipment loans, and real-time availability.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
            <Link to="/register" className="btn-primary text-base px-8 py-3 w-full sm:w-auto">
              🎓 Student Sign Up
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3 w-full sm:w-auto">
              👨‍🏫 Faculty Login
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative max-w-3xl mx-auto mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: '11', label: 'Sports', icon: '🏅' },
            { value: '38', label: 'Facilities', icon: '🏟️' },
            { value: '16+', label: 'Equipment Types', icon: '🎯' },
            { value: '24/7', label: 'Platform Access', icon: '⚡' },
          ].map(s => (
            <div key={s.label} className="card p-5 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sports grid */}
      <section className="px-6 lg:px-16 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-3">All Sports Available</h2>
            <p className="text-slate-400">Indoor and outdoor facilities across the Chitkara campus</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sports.map(sport => (
              <div key={sport.name} className="card-hover p-4 text-center group cursor-default">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{sport.icon}</div>
                <div className="font-semibold text-sm text-slate-200">{sport.name}</div>
                <div className="text-xs text-slate-500 mt-1">{sport.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-20 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-3">Everything You Need</h2>
            <p className="text-slate-400">Built for Chitkara students and faculty with modern web technology</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="card-hover p-6">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 lg:px-16 py-20 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-slate-400 mb-16">Book a facility in 3 simple steps</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            {[
              { step: '01', icon: '🔐', title: 'Register & Login', desc: 'Create your student account with roll number and department.' },
              { step: '02', icon: '🏟️', title: 'Browse & Book', desc: 'View available sports, check real-time availability, submit your request.' },
              { step: '03', icon: '✅', title: 'Get Approved', desc: 'Faculty approves your request. Get instant notification on your dashboard.' },
            ].map(s => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl mb-4 relative z-10">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-indigo-400 mb-2">STEP {s.step}</div>
                <h3 className="font-display text-lg font-bold text-white mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-20 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card p-12 glow-indigo">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="font-display text-4xl font-bold text-white mb-3">Ready to Play?</h2>
            <p className="text-slate-400 mb-8">Join thousands of Chitkara University students managing their sports activities on U-SPORT.</p>
            <Link to="/register" className="btn-primary text-base px-10 py-3 inline-block">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 px-6 lg:px-16 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-sm">⚡</div>
            <span className="font-display font-bold text-slate-300">U-SPORT</span>
            <span className="text-slate-600 text-sm">— Chitkara University</span>
          </div>
          <div className="text-sm text-slate-600">
            Built with ❤️ for Chitkara University Sports Department
          </div>
        </div>
      </footer>
    </div>
  );
}
