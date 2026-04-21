/**
 * Thin fetch wrapper that:
 *  - prefixes every path with /api (proxied to NestJS on :3001)
 *  - attaches the Bearer JWT from the auth store when present
 *  - throws a plain Error with the server's message on non-2xx
 */

// Read token without subscribing to re-renders — safe to call outside React
function authHeaders(): HeadersInit {
  try {
    const raw = localStorage.getItem('auth-store')
    const token = raw ? (JSON.parse(raw) as { state?: { token?: string } }).state?.token : null
    return token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' }
  } catch {
    return { 'Content-Type': 'application/json' }
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) return res.json() as Promise<T>
  let message = `Request failed: ${res.status}`
  try {
    const body = await res.json()
    if (body?.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message
  } catch { /* ignore */ }
  throw new Error(message)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return handleResponse<T>(res)
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: authHeaders() })
  return handleResponse<T>(res)
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return handleResponse<T>(res)
}
