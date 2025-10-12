import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	PropsWithChildren,
	useMemo,
	useCallback,
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
	const csrftoken = useMemo(
		() =>
			(document.cookie.split('; ').find((row) => row.startsWith('csrftoken=')) || '').split(
				'='
			)[1],
		[]
	);

	const fetchCurrent = useCallback(async () => {
		try {
			const resp = await apiFetch('/api/auth/user/', {
				headers: { 'X-CSRFToken': csrftoken },
			});
			if (resp.ok) {
				const data = await resp.json();
				setUser({ username: data.username });
				return;
			}
			setUser(null);
		} catch (err) {
			setUser(null);
		} finally {
			setLoading(false);
		}
	}, [csrftoken]);

	useEffect(() => {
		fetchCurrent();
	}, [fetchCurrent]);

	async function login(username: string, password: string) {
		const resp = await apiFetch('/api/auth/login/', {
			method: 'POST',
			headers: { 'X-CSRFToken': csrftoken },
			body: JSON.stringify({ username, password }),
		});
		if (!resp.ok) throw new Error('Login failed');
		await fetchCurrent();
	}

	async function register(payload: {
		username: string;
		email?: string;
		password: string;
		password2?: string;
	}) {
		const resp = await apiFetch('/api/auth/register/', {
			method: 'POST',
			headers: { 'X-CSRFToken': csrftoken },
			body: JSON.stringify(payload),
		});
		if (!resp.ok) throw new Error('Register failed');
	}

	async function logout() {
		await apiFetch('/api/auth/logout/', {
			method: 'POST',
			headers: { 'X-CSRFToken': csrftoken },
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
