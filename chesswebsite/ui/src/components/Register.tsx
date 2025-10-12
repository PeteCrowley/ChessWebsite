import React, { useState } from 'react';
import './css/Auth.css';
import apiFetch from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [password2, setPassword2] = useState('');
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const csrftoken = (
		document.cookie.split('; ').find((row) => row.startsWith('csrftoken=')) || ''
	).split('=')[1];

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		try {
			if (password !== password2) {
				setError('Passwords do not match');
				return;
			}
			const resp = await apiFetch('/api/auth/register/', {
				method: 'POST',
				headers: { 'X-CSRFToken': csrftoken },
				body: JSON.stringify({ username: username, password: password }),
			});
			if (resp.ok) {
				navigate('/login');
				return;
			}
			const data = await resp.json();
			setError(JSON.stringify(data));
		} catch (err: any) {
			setError(String(err));
		}
	}

	return (
		<div className="auth-card">
			<h2>Register</h2>
			{error && <div className="error">{error}</div>}
			<form onSubmit={handleSubmit}>
				<label>
					Username
					<input
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</label>
				<label>
					Password
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</label>
				<label>
					Confirm Password
					<input
						type="password"
						value={password2}
						onChange={(e) => setPassword2(e.target.value)}
						required
					/>
				</label>
				<button type="submit">Register</button>
			</form>
		</div>
	);
}
