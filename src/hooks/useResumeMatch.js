import { useState, useCallback } from "react";

export function useResumeMatch() {
  const [status, setStatus]   = useState("idle");
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [error, setError]     = useState(null);

  const uploadResume = useCallback(async (file, coords = null) => {
    setError(null); setProfile(null); setMatches([]); setStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("resume", file, file.name);

      let url = "/api/resume/parse-and-match";
      if (coords) url += `?lat=${coords.lat}&lng=${coords.lng}`;

      // No Content-Type header — browser sets multipart boundary automatically
      const res = await fetch(url, { method: "POST", body: formData });

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error("Server returned HTML. Make sure MONGO_URI and ANTHROPIC_API_KEY are set in Vercel.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Server error ${res.status}`);

      setProfile(data.profile);
      setMatches(data.matches || []);
      setStatus("success");
    } catch (err) {
      setError(err.message); setStatus("error");
    }
  }, []);

  const reset = useCallback(() => { setStatus("idle"); setProfile(null); setMatches([]); setError(null); }, []);
  return { status, profile, matches, error, uploadResume, reset };
}
