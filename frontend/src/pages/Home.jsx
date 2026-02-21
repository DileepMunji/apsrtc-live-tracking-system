import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

function Home() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [serverStatus, setServerStatus] = useState('checking');
    const [apiData, setApiData] = useState(null);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [loading, setLoading] = useState(false);

    // Login Form State
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    // Register Form State
    const [registerData, setRegisterData] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: '',
        licenseNumber: '', busNumber: '', routeType: 'both', homeCity: '', operatingCities: []
    });

    useEffect(() => {
        const checkServer = async () => {
            try {
                const res = await api.get('/api/test');
                setApiData(res.data);
                setServerStatus('online');
            } catch (error) {
                setServerStatus('offline');
            }
        };
        checkServer();
    }, []);

    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleRegisterChange = (e) => {
        const { name, value } = e.target;
        setRegisterData({ ...registerData, [name]: value });
    };

    const handleCityToggle = (city) => {
        setRegisterData(prev => ({
            ...prev,
            operatingCities: prev.operatingCities.includes(city)
                ? prev.operatingCities.filter(c => c !== city)
                : [...prev.operatingCities, city]
        }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(loginData.email, loginData.password);
        if (result.success) {
            toast.success('Login Successful!');
            setTimeout(() => navigate('/dashboard'), 1500);
        }
        setLoading(false);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (registerData.password !== registerData.confirmPassword) {
            return toast.error('Passwords do not match!');
        }
        setLoading(true);
        try {
            const res = await api.post('/api/auth/register', registerData);
            toast.success(res.data.message);
            setAuthMode('login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 overflow-x-hidden relative font-sans">
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <span className="block text-xl font-display font-bold text-white tracking-tight leading-none uppercase">APSRTC</span>
                            <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest mt-1">Live Tracking System</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${serverStatus === 'online' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {serverStatus === 'online' ? 'Server Live' : 'Backend Syncing'}
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
                {/* Left side: Content */}
                <div className="animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Ameerpet-Hitech City Live</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-[1.1] mb-8">
                        The Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600">Public Transport</span>
                    </h1>

                    <p className="text-lg text-slate-400 mb-10 max-w-xl leading-relaxed">
                        Precision tracking, seamless driver management, and real-time updates for millions of commuters across Andhra Pradesh.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/track')}
                            className="group px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-white/5"
                        >
                            Passenger Tracking Map
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                    </div>

                    {/* Specialized Passenger Feature Cards */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/stops')}
                            className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-orange-500/50 hover:bg-white/10 transition-all group"
                        >
                            <div className="text-2xl mb-3 opacity-80 group-hover:scale-110 transition-transform">📍</div>
                            <h4 className="text-white font-bold mb-1">Stops Near Me</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Find local boarding points</p>
                        </button>

                        <button
                            onClick={() => navigate('/search')}
                            className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-orange-500/50 hover:bg-white/10 transition-all group"
                        >
                            <div className="text-2xl mb-3 opacity-80 group-hover:scale-110 transition-transform">🔍</div>
                            <h4 className="text-white font-bold mb-1">Bus Search</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Search routes From-To</p>
                        </button>

                        <button
                            onClick={() => navigate('/city-bus')}
                            className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-orange-500/50 hover:bg-white/10 transition-all group"
                        >
                            <div className="text-2xl mb-3 opacity-80 group-hover:scale-110 transition-transform">🏙️</div>
                            <h4 className="text-white font-bold mb-1">City Bus</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Track by stops & schedule</p>
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-12 group">
                        <button
                            onClick={async () => {
                                try {
                                    await api.post('/api/bus/stops/seed');
                                    toast.success('Sample stops seeded!');
                                } catch (e) {
                                    toast.error('Seeding failed');
                                }
                            }}
                            className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em] hover:text-orange-500 transition-colors"
                        >
                            Initialize System Data
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-8 border-t border-white/5 pt-10">
                        <div>
                            <div className="text-2xl font-bold text-white">2.5k+</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Active Buses</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">18+</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Districts</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">99.9%</div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Uptime</div>
                        </div>
                    </div>
                </div>

                {/* Right side: Auth Portal */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-2 shadow-2xl overflow-hidden">
                        {/* Tabs */}
                        <div className="flex p-1">
                            <button
                                onClick={() => setAuthMode('login')}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${authMode === 'login' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                Driver Login
                            </button>
                            <button
                                onClick={() => setAuthMode('register')}
                                className={`flex-1 py-4 rounded-2xl font-bold text-sm transition-all ${authMode === 'register' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-white/5'}`}
                            >
                                Registration
                            </button>
                        </div>

                        <div className="p-8">
                            {authMode === 'login' ? (
                                <form onSubmit={handleLoginSubmit} className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
                                    <p className="text-sm text-slate-500 mb-6">Enter your credentials to manage your bus service.</p>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={loginData.email}
                                                onChange={handleLoginChange}
                                                placeholder="Email Address"
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-white placeholder:text-slate-600 font-medium"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="password"
                                                name="password"
                                                required
                                                value={loginData.password}
                                                onChange={handleLoginChange}
                                                placeholder="Password"
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-white placeholder:text-slate-600 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {loading ? 'Authenticating...' : 'Enter Driver Dashboard'}
                                        {!loading && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleRegisterSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
                                    <p className="text-sm text-slate-500 mb-6">Join the APSRTC network of professional drivers.</p>

                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            placeholder="Full Name"
                                            value={registerData.name}
                                            onChange={handleRegisterChange}
                                            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white"
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                placeholder="Email"
                                                value={registerData.email}
                                                onChange={handleRegisterChange}
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white"
                                            />
                                            <input
                                                type="tel"
                                                name="phone"
                                                required
                                                placeholder="Phone"
                                                value={registerData.phone}
                                                onChange={handleRegisterChange}
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                name="licenseNumber"
                                                required
                                                placeholder="License #"
                                                value={registerData.licenseNumber}
                                                onChange={handleRegisterChange}
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white uppercase"
                                            />
                                            <input
                                                type="text"
                                                name="busNumber"
                                                placeholder="Bus # (Opt)"
                                                value={registerData.busNumber}
                                                onChange={handleRegisterChange}
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white uppercase"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Route Type</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['city', 'express', 'both'].map(t => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setRegisterData({ ...registerData, routeType: t })}
                                                        className={`py-3 rounded-lg text-xs font-bold capitalize transition-all ${registerData.routeType === t ? 'bg-orange-500 text-white border-none shadow-lg shadow-orange-500/20' : 'bg-transparent text-slate-500 border border-white/5 hover:border-white/10'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Conditional Fields */}
                                        {(registerData.routeType === 'city' || registerData.routeType === 'both') && (
                                            <select
                                                name="homeCity"
                                                required={registerData.routeType === 'city'}
                                                value={registerData.homeCity}
                                                onChange={handleRegisterChange}
                                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white text-sm"
                                            >
                                                <option value="" className="bg-[#0F172A]">Select Home City</option>
                                                {['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada'].map(c => (
                                                    <option key={c} value={c} className="bg-[#0F172A]">{c}</option>
                                                ))}
                                            </select>
                                        )}

                                        {(registerData.routeType === 'express' || registerData.routeType === 'both') && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Operating Cities</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada'].map(city => (
                                                        <button
                                                            key={city}
                                                            type="button"
                                                            onClick={() => handleCityToggle(city)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${registerData.operatingCities.includes(city) ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500'}`}
                                                        >
                                                            {city}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <input
                                            type="password"
                                            name="password"
                                            required
                                            minLength={6}
                                            placeholder="Password"
                                            value={registerData.password}
                                            onChange={handleRegisterChange}
                                            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white"
                                        />
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            required
                                            placeholder="Confirm Password"
                                            value={registerData.confirmPassword}
                                            onChange={handleRegisterChange}
                                            className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 bg-white text-slate-900 font-bold rounded-xl hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        {loading ? 'Creating Account...' : 'Register as Driver'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-auto py-10 border-t border-white/5 bg-[#0F172A]/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <div className="w-6 h-6 bg-slate-400 rounded flex items-center justify-center text-[#0F172A] text-xs font-bold">A</div>
                        <span className="text-sm font-bold tracking-tight">APSRTC</span>
                    </div>
                    <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <a href="#" className="hover:text-orange-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-orange-400 transition-colors">Terms</a>
                        <a href="#" className="hover:text-orange-400 transition-colors">Contact</a>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">© 2026 Andhra Pradesh State Road Transport Corporation.</p>
                </div>
            </footer>
        </div>
    );
}

export default Home;
