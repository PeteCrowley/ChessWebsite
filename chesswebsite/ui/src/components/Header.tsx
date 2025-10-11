import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './css/Header.css';
import { useAuth } from './AuthContext';

export default function Header() {
	const auth = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		await auth.logout();
		navigate('/');
	}

	return (
		<header className="site-header">
			<div className="site-header-inner">
				<div className="site-title">Chess Website</div>
				<nav className="site-nav">
					<Link to="/" className="nav-link">
						Home
					</Link>
					<Link to="/analysis" className="nav-link">
						Analysis
					</Link>
					<Link to="/play/engine" className="nav-link">
						Play Engine
					</Link>
					{auth.isAuthenticated ? (
						<>
							<span className="nav-link">{auth.user?.username}</span>
							<span className="nav-link" onClick={handleLogout}>
								Logout
							</span>
						</>
					) : (
						<>
							<Link to="/login" className="nav-link">
								Login
							</Link>
							<Link to="/register" className="nav-link">
								Register
							</Link>
						</>
					)}
				</nav>
			</div>
		</header>
	);
}
