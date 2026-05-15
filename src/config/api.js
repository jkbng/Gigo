/**
 * Single deployment — frontend and backend share the same origin.
 * API calls go to /api/... on the same domain. No env var needed.
 */

export async function apiFetch(path, options = {}) {
  const res = await fetch(path, options);

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error("Server returned HTML instead of JSON. Check that the API route exists.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}
