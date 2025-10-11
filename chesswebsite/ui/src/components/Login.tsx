import React, { useState } from 'react';
import './css/Auth.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Login(){
  const auth = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent){
    e.preventDefault();
    setError(null);
    try{
        auth.login(username, password);
        navigate('/');
    }catch(err:any){
      setError(String(err));
    }
  }

  return (
    <div className="auth-card">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Username
          <input value={username} onChange={e=>setUsername(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </label>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
