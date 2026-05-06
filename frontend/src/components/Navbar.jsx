import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">InventralQ</Link>
            </div>
            <div className="navbar-links">
                {user ? (
                    <>
                        <span className="navbar-user">Hello, {user.name} ({user.role})</span>
                        {user.role === 'admin' && <Link to="/admin">Admin Dashboard</Link>}
                        {(user.role === 'admin' || user.role === 'manager') && <Link to="/insights">AI Insights</Link>}
                        {user.role === 'admin' && <Link to="/register">Register User</Link>}
                        <Link to="/staff">Make a Sale</Link>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
