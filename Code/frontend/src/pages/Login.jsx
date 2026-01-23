import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login(formData.username, formData.password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      window.location.href = '/home';
    } catch (err) {
      alert(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="text-center py-5 text-white" style={{ backgroundColor: '#007847', fontSize: '3rem', fontWeight: 'bold' }}>
        ToolShare
      </div>
      <div className="flex-grow-1 d-flex align-items-center justify-content-center px-3">
        <div className="card shadow-lg border-0" style={{ maxWidth: '420px', width: '100%', borderRadius: '20px' }}>
          <div className="card-body p-5">
            <h2 className="text-center mb-4" style={{ color: '#007847' }}>Login</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input type="text" name="username" className="form-control form-control-lg" placeholder="Enter username" onChange={handleChange} required />
              </div>
              <div className="mb-4">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-control form-control-lg" placeholder="Enter password" onChange={handleChange} required />
              </div>
              <button type="submit" disabled={loading} className="btn w-100 text-white" style={{ backgroundColor: '#007847', padding: '14px' }}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            <p className="text-center mt-4">
              No account? <Link to="/signup" style={{ color: '#007847', fontWeight: '600' }}>Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;