import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const initialMessage = location.state?.message;

  const [resendLoading, setResendLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(initialMessage || "OTP Sent Successfully!");

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccessMsg("");

    try {
      const user = await verifyOtp(email, otp);

      // Trigger success animation
      setSuccessAnim(true);
      
      // Delay redirect to let animation play
      setTimeout(() => {
        const dashboards = { admin: '/admin', student: '/dashboard' };
        navigate(dashboards[user.role] || '/dashboard');
      }, 1500);

    } catch (err) {
      // Trigger error shake animation by toggling state (css class handles animation)
      setError(err.response?.data?.message || "Invalid OTP");
      setOtp("");
      const formEl = document.getElementById("otp-form");
      if (formEl) {
        formEl.classList.remove("animate-shake");
        void formEl.offsetWidth; // trigger reflow
        formEl.classList.add("animate-shake");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendLoading(true);
    setSuccessMsg("");
    try {
      const data = await resendOtp(email);
      setSuccessMsg(data.message || "OTP resent successfully!");
      setTimeLeft(60);
      setOtp("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white gradient-bg">
        <div className="card p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">⏱️</div>
          <p className="text-slate-300 mb-6">Session expired. Please start the login process again.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">Return to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="card p-8 max-w-md w-full text-center relative z-10 glow-indigo animate-slide-up">

        {successAnim ? (
          <div className="py-12 flex flex-col items-center justify-center animate-scale-in">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-5xl text-emerald-400 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verified!</h2>
            <p className="text-emerald-400 font-medium">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-500/20 mb-6">
              <span className="text-2xl">🔐</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-white mb-2">Security Verification</h2>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              We've sent a one-time passcode to<br/>
              <span className="text-indigo-300 font-semibold">{email}</span>
            </p>

            {successMsg && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm flex items-center justify-center gap-2 animate-fade-in">
                <span>✉️</span> {successMsg}
              </div>
            )}

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center justify-center gap-2 animate-fade-in">
                <span>⚠️</span> {error}
              </div>
            )}

            <form id="otp-form" onSubmit={handleVerify} className="space-y-6">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:text-lg"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  autoFocus
                />
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/30 border border-indigo-500/50" 
                disabled={loading || otp.length < 6}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Verifying Code...
                  </>
                ) : "Verify & Continue"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/50">
              {timeLeft > 0 ? (
                <p className="text-sm text-slate-500">
                  Resend code in <span className="text-white font-mono">{timeLeft}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full"
                >
                  {resendLoading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : "↻"}
                  {resendLoading ? "Sending..." : "Resend OTP Code"}
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
