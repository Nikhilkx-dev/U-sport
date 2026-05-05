
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await verifyOtp(email, otp);

      // 🔥 role-based redirect
      navigate(user.role === "faculty" ? "/faculty" : "/dashboard");

    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <p>Session expired. Please login again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg p-4">
      <div className="card p-8 max-w-md w-full text-center">

        <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
        <p className="text-slate-400 text-sm mb-6">
          Enter OTP sent to <span className="text-indigo-400">{email}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            className="input-field text-center text-lg tracking-widest"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

      </div>
    </div>
  );
}

