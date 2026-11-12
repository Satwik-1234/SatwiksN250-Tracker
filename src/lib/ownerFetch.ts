import { clearOwnerToken, ensureOwnerToken, getOwnerToken } from '@/services/backendService';

/**
 * fetch() for owner-only routes. It attaches the owner session, and if the server says the
 * session is no longer valid (it expired, or the signing secret was changed), it signs in
 * again once with the PIN this device remembers and retries, so the owner is not asked twice.
 */
export async function ownerFetch(url: string, init: RequestInit = {}): Promise<Response> {
  await ensureOwnerToken();
  const send = () => {
    const token = getOwnerToken();
    return fetch(url, { ...init, headers: { ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  };
  let res = await send();
  if (res.status === 401 || res.status === 403) {
    clearOwnerToken();
    if (await ensureOwnerToken()) res = await send();
  }
  return res;
}
