import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const initAxios = (t) => {
        if (t) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    };

    useEffect(() => {
        const checkLoggedIn = async () => {
            if (token) {
                initAxios(token);
                try {
                    const res = await axios.get('http://localhost:5000/api/auth/me');
                    if (res.data.success) {
                        setUser(res.data.data);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    logout();
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, [token]);

    const login = async (email, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        if (res.data.token || res.data.success) {
            setToken(res.data.token);
            sessionStorage.setItem('token', res.data.token);
            initAxios(res.data.token);
            // Wait for /me route or just set user directly from login response
            setUser(res.data);
            return true;
        }
        return false;
    };

    const registerAccount = async (name, email, password, role = 'staff') => {
        const config = {};
        if (token) {
            config.headers = { Authorization: `Bearer ${token}` };
        }
        const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role }, config);
        
        // If it's the first user or we want auto-login upon registration, we can set state.
        // But usually, an admin creating a user shouldn't change the admin's own token.
        // So we just return success.
        if (res.data.success || res.status === 201) {
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        sessionStorage.removeItem('token');
        initAxios(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, registerAccount }}>
            {children}
        </AuthContext.Provider>
    );
};
