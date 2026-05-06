import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('staff');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    // AuthContext has the user in state to check if we're admin
    const { registerAccount, user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        try {
            const success = await registerAccount(name, email, password, role);
            if (success) {
                setSuccessMsg('User registered successfully!');
                setName('');
                setEmail('');
                setPassword('');
                
                // If not logged in, they are the first user and should login
                if (!user) {
                    setTimeout(() => navigate('/login'), 2000);
                }
            } else {
                setError('Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error registering');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>{user ? 'Register New User' : 'Register First Account'}</h2>
                {error && <p className="error-msg">{error}</p>}
                {successMsg && <p className="alert-success">{successMsg} { !user && "Redirecting to login..."}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {user && user.role === 'admin' && (
                        <div className="form-group">
                            <label>Role</label>
                            <select value={role} onChange={(e) => setRole(e.target.value)}>
                                <option value="staff">Staff</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    )}
                    <button type="submit" className="btn-primary">Register</button>
                </form>
                {!user && (
                    <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                        Already have an account? <Link to="/login">Login here</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Register;
