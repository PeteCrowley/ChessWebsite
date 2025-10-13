import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	PropsWithChildren,
} from 'react';
import apiFetch from '../lib/api';

type User = { username: string } | null;

type AuthContextType = {
	user: User;
	isAuthenticated: boolean;
	login: (username: string, password: string) => Promise<void>;
	register: (payload: { username: string; password: string }) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
	const [user, setUser] = useState<User>(null);
	const [loading, setLoading] = useState(true);

	async function fetchCurrent() {
		try {
			const resp = await apiFetch('/api/auth/user/');
			if (resp.ok) {
				const data = await resp.json();
				// backend may return { username: null } for unauthenticated users (200)
				if (data && data.username) {
					setUser({ username: data.username });
				} else {
					setUser(null);
				}
				return;
			}
			setUser(null);
		} catch (err) {
			setUser(null);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		fetchCurrent();
	}, []);

	async function login(username: string, password: string) {
		try {
			const resp = await apiFetch('/api/auth/login/', {
				method: 'POST',
				body: JSON.stringify({ username, password }),
			});
			if (!resp.ok) {
				// try to extract message from body
				let msg = 'Login failed';
				try {
					const j = await resp.json();
					if (j && j.error) msg = j.error;
					else if (j && j.message) msg = j.message;
				} catch (e) {
					// ignore JSON parse error
				}
				throw new Error(msg);
			}
			await fetchCurrent();
		} catch (e: any) {
			// Normalize errors so callers can reliably catch and display messages
			if (e instanceof Error) throw e;
			throw new Error(String(e));
		}
	}

	async function register(payload: {
		username: string;
		email?: string;
		password: string;
		password2?: string;
	}) {
		try {
			const resp = await apiFetch('/api/auth/register/', {
				method: 'POST',
				body: JSON.stringify(payload),
			});
			if (!resp.ok) {
				let msg = 'Register failed';
				try {
					const j = await resp.json();
					if (j && j.error) msg = j.error;
					else if (j && j.message) msg = j.message;
				} catch (e) {}
				throw new Error(msg);
			}
		} catch (e: any) {
			if (e instanceof Error) throw e;
			throw new Error(String(e));
		}
	}

	async function logout() {
		await apiFetch('/api/auth/logout/', {
			method: 'POST',
		});
		setUser(null);
	}

	if (loading) return null;

	return (
		<AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
}
