import { useEffect, useState } from "react";
import { useGigs } from "../hooks/useGigs";

const CATEGORY_META = {
  Delivery: { icon:"🛵", color:"bg-orange-100 text-orange-700" },
  Cleaning: { icon:"🧹", color:"bg-sky-100 text-sky-700" },
  Moving:   { icon:"📦", color:"bg-amber-100 text-amber-700" },
  Event:    { icon:"🎪", color:"bg-pink-100 text-pink-700" },
  Tech:     { icon:"💻", color:"bg-violet-100 text-violet-700" },
  Teaching: { icon:"📚", color:"bg-emerald-100 text-emerald-700" },
  Other:    { icon:"⚡", color:"bg-gray-100 text-gray-700" },
};
const FILTERS = ["All","Delivery","Cleaning","Moving","Event","Tech","Teaching"];

function CountdownTimer({ expiresInHours }) {
  const [timeStr, setTimeStr] = useState("");
  useEffect(() => {
    const update = () => {
      const diff = expiresInHours * 3600000;
      if (diff <= 0) { setTimeStr("Expired"); return; }
      setTimeStr(`${Math.floor(diff/3600000)}h ${Math.floor((diff%3600000)/60000)}m left`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [expiresInHours]);
  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${expiresInHours < 3 ? "text-red-500" : "text-gray-400"}`}>
      {expiresInHours < 3 ? "🔴" : "⏱"} {timeStr}
    </span>
  );
}

function GigCard({ gig, onApply }) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied]   = useState(false);
  const meta = CATEGORY_META[gig.category] || CATEGORY_META.Other;
  const slotsPercent = Math.round(((gig.slots - gig.slotsRemaining) / gig.slots) * 100);
  const isFull = gig.slotsRemaining === 0;

  const handleApply = async () => {
    if (applied || isFull || applying) return;
    setApplying(true);
    await onApply(gig._id);
    setApplied(true); setApplying(false);
  };

  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${meta.color.split(" ")[0]}`}>{meta.icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{gig.title}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{gig.company}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${meta.color}`}>{gig.category}</span>
      </div>
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-400 flex-wrap">
        {gig.location?.address && <span>📍 {gig.location.address}</span>}
        {gig.distanceKm != null && <span>· {gig.distanceKm} km</span>}
        <span>· {gig.duration}</span>
      </div>
      {gig.requirements?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {gig.requirements.map(r => (
            <span key={r} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">{r}</span>
          ))}
        </div>
      )}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{gig.slotsRemaining} of {gig.slots} slots open</span>
          <CountdownTimer expiresInHours={gig.expiresInHours ?? 12} />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${slotsPercent > 75 ? "bg-red-400" : "bg-orange-400"}`}
            style={{ width: `${slotsPercent}%` }} />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-orange-50">
        <div>
          <span className="text-base font-bold text-gray-900">{gig.pay}</span>
          <span className="text-xs text-gray-400 ml-1">/{gig.payType}</span>
        </div>
        <button onClick={handleApply} disabled={isFull || applied || applying}
          className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all active:scale-95
            ${applied ? "bg-green-100 text-green-700 cursor-default"
              : isFull ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600 shadow-sm"}`}>
          {applying ? "…" : applied ? "✓ Applied" : isFull ? "Full" : "Grab Gig"}
        </button>
      </div>
    </div>
  );
}

export default function DailyGigs({ userCoords }) {
  const { gigs, status, error, findNearbyGigs, applyToGig } = useGigs();
  const [filter, setFilter] = useState("All");

  useEffect(() => { findNearbyGigs(userCoords); }, []); // eslint-disable-line

  const filtered = filter === "All" ? gigs : gigs.filter(g => g.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Today's Gigs</h3>
          <p className="text-xs text-gray-400">Expires at midnight · Grab fast</p>
        </div>
        <button onClick={() => findNearbyGigs(userCoords)} className="text-xs text-orange-600 font-medium hover:text-orange-800">Refresh ↺</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all
              ${filter === f ? "bg-orange-500 text-white border-orange-500 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"}`}>
            {CATEGORY_META[f]?.icon ?? ""} {f}
          </button>
        ))}
      </div>

      {status === "fetching" && (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-400">
          <svg className="w-5 h-5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading gigs…
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">⚠️ {error}</div>
      )}
      {status === "success" && filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-gray-500 text-sm font-medium">No gigs in this category</p>
          <p className="text-gray-400 text-xs mt-1">Try "All" or POST /api/gigs/seed</p>
        </div>
      )}
      {status === "success" && filtered.length > 0 && (
        <div className="space-y-3">{filtered.map(gig => <GigCard key={gig._id} gig={gig} onApply={applyToGig} />)}</div>
      )}
    </div>
  );
}
