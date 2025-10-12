const API_BASE = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '');

let WS_BASE = '';
if (API_BASE) {
	// If API_BASE starts with http:// or https://, convert to ws:// or wss://
	const m = API_BASE.match(/^(https?):\/\//i);
	if (m) {
		const scheme = m[1].toLowerCase();
		WS_BASE = API_BASE.replace(/^(https?):\/\//i, scheme === 'https' ? 'wss://' : 'ws://');
	} else {
		// No protocol in API_BASE; assume host-only and prefix ws://
		// if it is https we want wss else ws
		if (window.location.protocol === 'https:') {
			WS_BASE = 'wss://' + API_BASE;
		} else {
			WS_BASE = 'ws://' + API_BASE;
		}
	}
}

export function buildUrl(path: string) {
	if (!API_BASE) return path;
	return `${API_BASE}/${path.replace(/^\//, '')}`;
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
	const url = buildUrl(path);
	const defaultOpts: RequestInit = {
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
	};
	const merged = { ...defaultOpts, ...opts } as RequestInit;
	// Merge headers explicitly
	merged.headers = { ...(defaultOpts.headers || {}), ...(opts.headers || {}) };
	return fetch(url, merged);
}

export default apiFetch;

export function buildWsUrl(path: string) {
	if (!WS_BASE) return path;
	return `${WS_BASE}/${path.replace(/^\//, '')}`;
}
