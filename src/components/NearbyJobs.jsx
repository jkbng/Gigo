import { useState, useEffect } from "react";
import { apiFetch } from "../config/api";

const TYPE_COLORS = {
  "Full-time":  "bg-orange-100 text-orange-700",
  "Part-time":  "bg-amber-100 text-amber-700",
  "Contract":   "bg-yellow-100 text-yellow-700",
  "Internship": "bg-lime-100 text-lime-700",
  "Remote":     "bg-green-100 text-green-700",
};

function JobCard({ job }) {
  const colorCls = TYPE_COLORS[job.type] || "bg-gray-100 text-gray-600";
  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {job.company?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{job.title}</h3>
            <p className="text-gray-400 text-xs mt-0.5">{job.company}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${colorCls}`}>{job.type}</span>
      </div>
      {job.location?.address && (
        <p className="text-xs text-gray-400 mb-2">📍 {job.location.address}{job.distanceKm != null ? ` · ${job.distanceKm} km` : ""}</p>
      )}
      {job.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.tags.slice(0,5).map(tag => (
            <span key={tag} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-orange-50">
        <span className="text-sm font-bold text-gray-900">{job.salary || "Salary on discussion"}</span>
        <button className="text-xs font-semibold text-white bg-orange-500 px-3 py-1.5 rounded-xl hover:bg-orange-600 transition-all active:scale-95 shadow-sm">
          Apply →
        </button>
      </div>
    </div>
  );
}

export default function NearbyJobs({ userCoords, getLocation }) {
  const [jobs, setJobs]     = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError]   = useState(null);

  const fetchJobs = async (coords = null) => {
    setStatus("fetching"); setError(null);
    try {
      const path = coords ? `/api/jobs/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=10000` : "/api/jobs";
      const data = await apiFetch(path);
      setJobs(data.jobs || []);
      setStatus("success");
    } catch (err) { setError(err.message); setStatus("error"); }
  };

  useEffect(() => { fetchJobs(userCoords); }, [userCoords]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{userCoords ? "Jobs Near You" : "All Jobs"}</h3>
          <p className="text-xs text-gray-400">{userCoords ? "Within 10 km" : "Enable location for nearby results"}</p>
        </div>
        <div className="flex gap-2 items-center">
          {!userCoords && (
            <button onClick={async () => { try { const c = await getLocation(); fetchJobs(c); } catch {} }}
              className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full font-medium hover:bg-orange-100 transition-colors">
              📍 Use location
            </button>
          )}
          <button onClick={() => fetchJobs(userCoords)} className="text-xs text-orange-600 font-medium hover:text-orange-800">Refresh ↺</button>
        </div>
      </div>

      {status === "fetching" && (
        <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-400">
          <svg className="w-5 h-5 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Loading jobs…
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-600">
          <p className="font-semibold mb-1">⚠️ Could not load jobs</p>
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {status === "success" && jobs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 text-sm font-medium">No jobs found</p>
          <p className="text-gray-400 text-xs mt-1">POST /api/jobs/seed to add sample jobs</p>
        </div>
      )}
      {status === "success" && jobs.length > 0 && (
        <div className="space-y-3">{jobs.map(job => <JobCard key={job._id} job={job} />)}</div>
      )}
    </div>
  );
}
