import { useRef, useState } from "react";
import { useResumeMatch } from "../hooks/useResumeMatch";

const SCORE_COLOR = (s) => {
  if (s >= 80) return { bar:"#f97316", text:"text-orange-600", bg:"bg-orange-50 border-orange-200" };
  if (s >= 60) return { bar:"#f59e0b", text:"text-amber-600",  bg:"bg-amber-50 border-amber-200" };
  return              { bar:"#94a3b8", text:"text-slate-500",  bg:"bg-slate-50 border-slate-200" };
};

function MatchScoreBar({ score }) {
  const c = SCORE_COLOR(score);
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${score}%`, background:c.bar }} />
      </div>
      <span className={`text-xs font-bold ${c.text}`}>{score}%</span>
    </div>
  );
}

export default function ResumeMatch({ userCoords }) {
  const fileRef = useRef();
  const [dragging, setDragging]       = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const { status, profile, matches, error, uploadResume, reset } = useResumeMatch();
  const isLoading = status === "uploading";

  const handleFile = (file) => {
    if (!file) return;
    const ok = file.type === "application/pdf" || file.type === "text/plain" ||
               file.name.toLowerCase().endsWith(".pdf") || file.name.toLowerCase().endsWith(".txt");
    if (!ok) { alert("Please upload a PDF or TXT resume."); return; }
    setSelectedFile(file);
  };

  const handleReset = () => {
    setSelectedFile(null); reset();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {status !== "success" && (
        <div className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold text-gray-800 text-sm">AI Resume Match</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Upload your resume — GigoAI finds jobs that fit your skills</p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
              ${dragging ? "border-orange-400 bg-orange-50"
                : selectedFile ? "border-orange-300 bg-orange-50"
                : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/50"}`}
          >
            <input ref={fileRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">📄</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-orange-700">{selectedFile.name}</p>
                  <p className="text-xs text-orange-400">{(selectedFile.size/1024).toFixed(0)} KB · Ready</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm font-medium text-gray-500">Drop your resume here</p>
                <p className="text-xs text-gray-400 mt-1">PDF or TXT · Max 5 MB</p>
                <p className="text-xs text-orange-500 mt-2 font-medium">or click to browse</p>
              </div>
            )}
          </div>

          {status === "error" && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 flex gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => selectedFile && !isLoading && uploadResume(selectedFile, userCoords)}
              disabled={!selectedFile || isLoading}
              className="flex-1 bg-orange-500 text-white text-sm font-semibold py-3 rounded-xl hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>Analysing with AI…</>
              ) : "✨ Find My Matches"}
            </button>
            {selectedFile && !isLoading && (
              <button onClick={handleReset} className="px-4 py-3 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Clear</button>
            )}
          </div>
        </div>
      )}

      {status === "success" && profile && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-orange-200 mb-0.5">Resume analysed ✓</p>
              <h3 className="font-bold text-base">{profile.name || "Your Profile"}</h3>
              <p className="text-orange-200 text-xs mt-0.5">
                {profile.experience_years ? `${profile.experience_years} yrs exp` : ""}
                {profile.education ? ` · ${profile.education}` : ""}
              </p>
            </div>
            <button onClick={handleReset} className="text-orange-200 hover:text-white text-xs bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors">Upload new ↩</button>
          </div>
          {profile.summary && <p className="text-orange-100 text-xs leading-relaxed mb-3">{profile.summary}</p>}
          <div className="flex flex-wrap gap-1.5">
            {profile.skills?.slice(0,8).map(s => (
              <span key={s} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{matches.length} matched {matches.length === 1 ? "job" : "jobs"}</p>
            <p className="text-xs text-gray-400">sorted by AI fit score</p>
          </div>
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500 text-sm font-medium">No matching jobs found</p>
              <p className="text-gray-400 text-xs mt-1">POST /api/jobs/seed to add sample jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((job, i) => {
                const c = SCORE_COLOR(job.matchScore);
                return (
                  <div key={job._id} className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                          style={{ background:`hsl(${(i*47+20)%360},70%,55%)` }}>
                          {job.company?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{job.title}</p>
                          <p className="text-gray-400 text-xs">{job.company}</p>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${c.bg} ${c.text}`}>{job.matchScore}% fit</span>
                    </div>
                    <MatchScoreBar score={job.matchScore} />
                    {job.matchReason && <p className="text-xs text-gray-500 mt-2 italic">"{job.matchReason}"</p>}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-orange-50">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">{job.type}</span>
                        {job.salary && <span className="text-xs font-semibold text-gray-700">{job.salary}</span>}
                        {job.distanceKm && <span className="text-xs text-gray-400">📍 {job.distanceKm} km</span>}
                      </div>
                      <button className="text-xs font-semibold text-orange-600 hover:text-orange-800 transition-colors">Apply →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
