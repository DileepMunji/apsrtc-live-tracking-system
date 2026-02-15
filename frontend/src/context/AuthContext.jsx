import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Check auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = () => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password });

            if (response.data.success) {
                const { token, driver } = response.data;

                // Store in localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(driver));

                // Update state
                setToken(token);
                setUser(driver);
                setIsAuthenticated(true);

                toast.success(response.data.message);
                return { success: true };
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(message);
            return { success: false, message };
        }
    };

    const logout = () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear state
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);

        toast.success('Logged out successfully');
    };

    const value = {
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
