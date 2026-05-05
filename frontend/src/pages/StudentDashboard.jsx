
import { useEffect, useState } from "react";
import api from "../services/api";

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔐 get user profile
        const userRes = await api.get("/auth/profile");
        setProfile(userRes.data.data);

        // 📋 get user requests (example endpoint)
        const reqRes = await api.get("/requests/my");
        setRequests(reqRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome, {profile?.name} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Department: {profile?.department}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="card p-4">
          <p className="text-slate-400 text-sm">Total Requests</p>
          <h2 className="text-xl font-bold text-white">
            {requests.length}
          </h2>
        </div>

        <div className="card p-4">
          <p className="text-slate-400 text-sm">Approved</p>
          <h2 className="text-green-400 text-xl font-bold">
            {requests.filter(r => r.status === "approved").length}
          </h2>
        </div>

        <div className="card p-4">
          <p className="text-slate-400 text-sm">Pending</p>
          <h2 className="text-yellow-400 text-xl font-bold">
            {requests.filter(r => r.status === "pending").length}
          </h2>
        </div>

      </div>

      {/* Recent Requests */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-white mb-3">
          Recent Requests
        </h2>

        {requests.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No requests yet.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.slice(0, 5).map((req) => (
              <div
                key={req._id}
                className="flex justify-between items-center p-3 rounded-lg bg-slate-800/60"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {req.title || "Request"}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {req.type || "General"}
                  </p>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full ${
                  req.status === "approved"
                    ? "bg-green-500/20 text-green-400"
                    : req.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

