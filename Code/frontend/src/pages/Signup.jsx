import React, { useState } from 'react';
import { authService } from '../services/api';

const Signup = () => {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', student_id: '',
    username: '', email: '', password: '', user_type: 'student'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.register(formData);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      window.location.href = '/home';
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 className="text-center mb-4 text-primary">Create Account</h2>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col"><input name="first_name" placeholder="First Name" className="form-control" onChange={handleChange} required /></div>
            <div className="col"><input name="last_name" placeholder="Last Name" className="form-control" onChange={handleChange} required /></div>
          </div>
          <input name="student_id" placeholder="Student/Faculty ID" className="form-control mb-3" onChange={handleChange} required />
          <input name="username" placeholder="Username" className="form-control mb-3" onChange={handleChange} required />
          <input name="email" placeholder="Email" type="email" className="form-control mb-3" onChange={handleChange} required />
          <input name="password" placeholder="Password" type="password" className="form-control mb-3" onChange={handleChange} required />
          <div className="mb-3">
            <label><input type="radio" name="user_type" value="student" onChange={handleChange} defaultChecked /> Student</label> &nbsp;
            <label><input type="radio" name="user_type" value="faculty" onChange={handleChange} /> Faculty</label>
          </div>
          <button type="submit" className="btn btn-success w-100 btn-success">Sign Up</button>
        </form>
        <p className="text-center mt-3">Have account? <a href="/login">Login</a></p>
      </div>
    </div>
  );
};

export default Signup;