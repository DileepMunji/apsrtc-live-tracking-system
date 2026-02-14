import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
    const navigate = useNavigate();
    const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
    const [apiData, setApiData] = useState(null);

    useEffect(() => {
        const checkServer = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/test');
                setApiData(res.data);
                setServerStatus('online');
            } catch (error) {
                setServerStatus('offline');
            }
        };
        checkServer();
    }, []);

    return (
        <div className="min-h-screen font-sans">

            {/* 1. Header / Navbar */}
            <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <span className="block text-xl font-display font-bold text-slate-900 tracking-tight leading-none">APSRTC</span>
                            <span className="block text-[10px] font-bold text-orange-600 uppercase tracking-widest">Official Portal</span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#" className="font-medium text-slate-700 hover:text-orange-600 transition-colors">Home</a>
                        <a href="#" className="font-medium text-slate-700 hover:text-orange-600 transition-colors">e-Ticket</a>
                        <a href="#" className="font-medium text-slate-700 hover:text-orange-600 transition-colors">Bus Status</a>
                        <a href="#" className="font-medium text-slate-700 hover:text-orange-600 transition-colors">Gallery</a>
                    </nav>

                    <div className="flex items-center gap-4">
                        {/* Connection Status Indicator */}
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${serverStatus === 'online' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {serverStatus === 'online' ? 'System Live' : 'Backend Offline'}
                        </div>
                        <button
                            onClick={() => navigate('/register')}
                            className="hidden md:block px-5 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
                        >
                            Driver Register
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. Hero Section with Search Widget */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white -z-10"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/40 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in-up">
                        <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 leading-tight mb-6">
                            Travel Smart with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">APSRTC Live Track</span>
                        </h1>
                        <p className="text-lg text-slate-600 mb-8">
                            Experience the next generation of bus travel. Track your bus in real-time, get instant updates, and travel safely across Andhra Pradesh.
                        </p>
                    </div>

                    {/* Search/Booking Widget - WIDENED CONTAINER */}
                    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-2 md:p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative h-full group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none group-focus-within:text-orange-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </span>
                                <input type="text" placeholder="From City" className="w-full h-16 pl-16 pr-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all font-bold text-lg text-slate-700 placeholder:text-slate-400 placeholder:font-normal" />
                            </div>

                            <div className="relative h-full group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none group-focus-within:text-orange-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </span>
                                <input type="text" placeholder="To City" className="w-full h-16 pl-16 pr-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all font-bold text-lg text-slate-700 placeholder:text-slate-400 placeholder:font-normal" />
                            </div>

                            <div className="relative h-full group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-orange-500 transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </span>
                                <input type="date" className="w-full h-16 pl-16 pr-4 rounded-xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all font-bold text-lg text-slate-700 cursor-pointer placeholder:text-slate-400" />
                            </div>

                            <div>
                                <button className="w-full h-16 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-xl tracking-wide">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    SEARCH
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Server Status Debug Box (For Slice 1 Verification) */}
                <div className="max-w-7xl mx-auto px-4 mt-16">
                    <div className="max-w-screen-md mx-auto bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Development Status</h3>

                        {serverStatus === 'online' ? (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Connection Successful</h4>
                                    <p className="text-slate-600 text-sm mt-1">{apiData?.message}</p>
                                    <div className="mt-3 flex gap-3 text-xs font-mono text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded">Ver: {apiData?.version}</span>
                                        <span className="bg-slate-100 px-2 py-1 rounded">Status: {apiData?.status}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">Connection Failed</h4>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Could not connect to backend. Please check if `npm run dev` is running in backend folder and MongoDB is connected.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </section>

            {/* 4. Features Grid */}
            <section className="bg-slate-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: 'Live Tracking', desc: 'Track any bus in real-time with zero latency.', icon: '🛰️' },
                            { title: 'Digital Passes', desc: 'Apply and renew bus passes digitally.', icon: '💳' },
                            { title: 'Route Info', desc: 'Detailed route maps and timing schedules.', icon: '🗺️' }
                        ].map((item, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="text-4xl mb-4">{item.icon}</div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

        </div >
    );
}

export default Home;
