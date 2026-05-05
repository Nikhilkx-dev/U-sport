
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useToast } from '../components/Toast';
import SportCard from '../components/SportCard';
import BookingModal from '../components/BookingModal';
import MaintenanceBanner from '../components/MaintenanceBanner';

const isMaintenanceTime = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const total = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return total >= 960 && total < 1020;
};

export default function SportsPage() {
  const addToast = useToast();

  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null);

  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [maintenance, setMaintenance] = useState(isMaintenanceTime());

  // 🔄 Fetch sports
  const fetchSports = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await api.get('/sports');
      setSports(res.data.data || []);
    } catch (err) {
      addToast("Failed to load sports", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🚀 Initial load
  useEffect(() => {
    fetchSports();
    const iv = setInterval(() => setMaintenance(isMaintenanceTime()), 60000);
    return () => clearInterval(iv);
  }, []);

  // 🔌 Real-time updates
  useSocket({
    facility_approved: () => fetchSports(true),
    facility_released: () => fetchSports(true),
  });

  // 🔍 Filters
  const filtered = sports
    .filter(s =>
      category === 'all'
        ? true
        : category === 'available'
        ? s.availableFacilities > 0
        : s.category === category
    )
    .filter(s =>
      search ? s.name.toLowerCase().includes(search.toLowerCase()) : true
    );

  const outdoor = sports.filter(s => s.category === 'outdoor');
  const indoor = sports.filter(s => s.category === 'indoor');
  const available = sports.filter(s => s.availableFacilities > 0);

  return (
    <div>

      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Sports Facilities
          </h1>
          <p className="text-slate-400 mt-1">
            Browse and book available sports facilities
          </p>
        </div>

        {/* 🔄 Manual refresh */}
        <button
          onClick={() => fetchSports(true)}
          className="text-sm text-indigo-400 hover:text-indigo-300"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {maintenance && <MaintenanceBanner />}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-indigo-400">
            {outdoor.length}
          </div>
          <div className="text-xs text-slate-500">☀️ Outdoor</div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">
            {indoor.length}
          </div>
          <div className="text-xs text-slate-500">🏢 Indoor</div>
        </div>

        <div className="card p-4 text-center">
          <div className={`text-2xl font-bold ${
            available.length ? 'text-green-400' : 'text-red-400'
          }`}>
            {available.length}
          </div>
          <div className="text-xs text-slate-500">Available</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* Search */}
        <input
          className="input-field max-w-xs"
          placeholder="Search sports..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Category */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'outdoor', 'indoor', 'available'].map(key => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`px-4 py-2 rounded-xl text-sm ${
                category === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

      </div>

      {/* Count */}
      <p className="text-xs text-slate-500 mb-4">
        {filtered.length} sport(s) found
      </p>

      {/* Loading */}
      {loading ? (
        <div className="text-slate-400">Loading sports...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No sports found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(sport => (
            <SportCard
              key={sport._id}
              sport={sport}
              onRequest={setSelectedSport}
            />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedSport && (
        <BookingModal
          sport={selectedSport}
          onClose={() => setSelectedSport(null)}
          onSuccess={() => {
            addToast("Request submitted successfully!", "success");
            fetchSports(true);
          }}
        />
      )}

    </div>
  );
}

