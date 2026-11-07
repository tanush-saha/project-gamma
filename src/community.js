export const COMMUNITY_FILE_LIMIT = 20 * 1024 * 1024;
export const communityApiUrl = (import.meta.env.VITE_COMMUNITY_API_URL || "").trim().replace(/\/+$/, "");
export const communityApiConfigured = Boolean(communityApiUrl);

export async function communityRequest(path, { user, method = "GET", headers = {}, body } = {}) {
  if (!communityApiConfigured) {
    throw new Error("The shared book cloud is not configured. See the Cloudflare setup guide on the account page.");
  }

  const requestHeaders = new Headers(headers);
  if (user && !user.isAnonymous) {
    requestHeaders.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }
  const response = await fetch(`${communityApiUrl}${path}`, {
    method,
    headers: requestHeaders,
    body,
  });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`The shared book service returned an unreadable response (${response.status}).`);
  }
  if (!response.ok) {
    const error = new Error(payload.error || `The shared book service returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function formatFileSize(byteCount) {
  if (!Number.isFinite(byteCount) || byteCount < 0) return "Unknown size";
  if (byteCount < 1024 * 1024) return `${(byteCount / 1024).toFixed(0)} KB`;
  return `${(byteCount / (1024 * 1024)).toFixed(1)} MB`;
}
