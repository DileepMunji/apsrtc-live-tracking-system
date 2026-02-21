import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CityBusSearch() {
    const navigate = useNavigate();
    const [city, setCity] = useState('');
    const [routeNumber, setRouteNumber] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (city && routeNumber) {
            // We pass parameters via URL
            navigate(`/route-track/${routeNumber.toUpperCase()}?city=${city}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

            <nav className="fixed top-0 w-full z-50 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-black text-white uppercase tracking-tight">City Bus Search</h1>
                    <div className="w-10"></div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-4 max-w-lg mx-auto">
                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl animate-fade-in-up">
                    <div className="mb-8 text-center">
                        <div className="text-4xl mb-4">🏙️</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Track City Bus</h2>
                        <p className="text-sm text-slate-500">Select your city and enter the route number to see the live tracking schedule.</p>
                    </div>

                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">City Name</label>
                            <select
                                required
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-white font-medium appearance-none"
                            >
                                <option value="" className="bg-[#0F172A]">Select City</option>
                                <option value="Hyderabad" className="bg-[#0F172A]">Hyderabad</option>
                                <option value="Visakhapatnam" className="bg-[#0F172A]">Visakhapatnam</option>
                                <option value="Vijayawada" className="bg-[#0F172A]">Vijayawada</option>
                                <option value="Guntur" className="bg-[#0F172A]">Guntur</option>
                                <option value="Tirupati" className="bg-[#0F172A]">Tirupati</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Route Number</label>
                            <input
                                type="text"
                                required
                                value={routeNumber}
                                onChange={(e) => setRouteNumber(e.target.value)}
                                placeholder="e.g. 222R"
                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-2xl outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all text-white placeholder:text-slate-700 font-medium uppercase"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                        >
                            Track Live Schedule
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    </form>
                </div>

                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-2xl border-dashed">
                    <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2">Pro Tip</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        Currently tracking is active for Hyderabad (Route 222R). Enter these details to see the premium live tracking dashboard in action.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default CityBusSearch;
