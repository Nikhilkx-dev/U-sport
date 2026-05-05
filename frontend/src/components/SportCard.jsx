import { useState } from 'react';

export default function SportCard({ sport, onRequest }) {
  const availPct = sport.totalFacilities > 0
    ? Math.round((sport.availableFacilities / sport.totalFacilities) * 100)
    : 0;
  const isAvailable = sport.availableFacilities > 0;

  const barColor = availPct > 60 ? 'from-emerald-500 to-emerald-400'
    : availPct > 30 ? 'from-amber-500 to-amber-400'
    : 'from-red-500 to-red-400';

  return (
    <div className="card-hover overflow-hidden group flex flex-col">
      {/* Image */}
      <div className="relative h-36 bg-slate-800 overflow-hidden">
        {sport.image ? (
          <img src={sport.image} alt={sport.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-70" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">{sport.icon}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
            sport.category === 'outdoor'
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
              : 'bg-violet-500/20 text-violet-300 border-violet-500/30'
          }`}>
            {sport.category === 'outdoor' ? '☀️ Outdoor' : '🏢 Indoor'}
          </span>
        </div>

        {/* Availability badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
            isAvailable
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}>
            {isAvailable ? '● Available' : '● Full'}
          </span>
        </div>

        {/* Sport name on image */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span className="text-2xl">{sport.icon}</span>
          <h3 className="font-display text-lg font-bold text-white drop-shadow-lg">{sport.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Facility counts */}
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <div className="font-display text-xl font-bold text-white">{sport.totalFacilities}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className={`font-display text-xl font-bold ${sport.usedFacilities > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {sport.usedFacilities}
            </div>
            <div className="text-xs text-slate-500">In Use</div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center">
            <div className={`font-display text-xl font-bold ${isAvailable ? 'text-emerald-400' : 'text-red-400'}`}>
              {sport.availableFacilities}
            </div>
            <div className="text-xs text-slate-500">Free</div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Capacity</span>
            <span>{availPct}% free</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
              style={{ width: `${availPct}%` }}
            />
          </div>
        </div>

        {/* Request button */}
        <button
          onClick={() => onRequest(sport)}
          disabled={!isAvailable}
          className={`mt-auto w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            isAvailable
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          {isAvailable ? '📋 Request Facility' : '⛔ No Availability'}
        </button>
      </div>
    </div>
  );
}
