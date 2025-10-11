import React from 'react';
import { Link } from 'react-router-dom';
import './css/Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="site-title">Chess Website</div>
        <nav className="site-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/analysis" className="nav-link">Analysis</Link>
          <Link to="/play/engine" className="nav-link">Play Engine</Link>
        </nav>
      </div>
    </header>
  );
}
