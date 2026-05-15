import { useState, useCallback } from "react";
import { apiFetch } from "../config/api";

export function useGigs() {
  const [gigs, setGigs]     = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError]   = useState(null);

  const findNearbyGigs = useCallback(async (coords = null) => {
    setError(null); setGigs([]); setStatus("fetching");
    try {
      const path = coords
        ? `/api/gigs/nearby?lat=${coords.lat}&lng=${coords.lng}&radius=5000`
        : "/api/gigs";
      const data = await apiFetch(path);
      setGigs(data.gigs || []);
      setStatus("success");
    } catch (err) {
      setError(err.message); setStatus("error");
    }
  }, []);

  const applyToGig = useCallback(async (gigId) => {
    try {
      const data = await apiFetch(`/api/gigs/${gigId}/apply`, { method: "POST" });
      if (data.success) {
        setGigs(prev => prev.map(g => g._id === gigId ? { ...g, slotsRemaining: data.slotsRemaining } : g));
      }
      return data;
    } catch (err) { console.error("Apply error:", err); }
  }, []);

  const reset = useCallback(() => { setGigs([]); setStatus("idle"); setError(null); }, []);
  return { gigs, status, error, findNearbyGigs, applyToGig, reset };
}
