import { useState, useCallback } from "react";
import NearbyJobs from "./components/NearbyJobs";
import ResumeMatch from "./components/ResumeMatch";
import DailyGigs from "./components/DailyGigs";

const TABS = [
  { id: "nearby", label: "Nearby",   icon: "📍" },
  { id: "resume", label: "AI Match", icon: "✨" },
  { id: "gigs",   label: "Gigs",     icon: "⚡" },
];

export default function App() {
  const [activeTab, setActiveTab]   = useState("nearby");
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating]     = useState(false);

  const getLocation = useCallback(() => new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const c = { lat: coords.latitude, lng: coords.longitude };
        setUserCoords(c); setLocating(false); resolve(c);
      },
      (err) => { setLocating(false); reject(err); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }), []);

  return (
    <div className="min-h-screen bg-orange-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow">
          <span className="text-white text-lg">⚡</span>
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900 text-base tracking-tight">
            Gigo<span className="text-orange-500">AI</span>
          </h1>
          <p className="text-xs text-gray-400 -mt-0.5">Smart job discovery</p>
        </div>
        {userCoords ? (
          <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
            📍 Located
          </span>
        ) : (
          <button
            onClick={getLocation} disabled={locating}
            className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full font-medium hover:bg-orange-100 transition-colors active:scale-95 disabled:opacity-60"
          >
            {locating ? "Locating…" : "📍 Locate Me"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-orange-100 px-4">
        <div className="flex max-w-lg mx-auto">
          {TABS.map(tab => (
            <button
              key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-all duration-150 flex-1 justify-center
                ${activeTab === tab.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5">
        {activeTab === "nearby" && <NearbyJobs userCoords={userCoords} getLocation={getLocation} />}
        {activeTab === "resume" && <ResumeMatch userCoords={userCoords} />}
        {activeTab === "gigs"   && <DailyGigs userCoords={userCoords} />}
      </div>
    </div>
  );
}
