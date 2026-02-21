import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

function BusSearch() {
    const navigate = useNavigate();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.get(`/api/bus/search?from=${from}&to=${to}`);
            setResults(res.data.buses);
            setHasSearched(true);
        } catch (error) {
            toast.error('Search failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0F172A] text-slate-200 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="flex items-center gap-4 mb-12 animate-fade-in-down">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h1 className="text-3xl font-display font-bold text-white uppercase tracking-tight">Bus Search</h1>
                </header>

                <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl mb-12 animate-fade-in-up">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">From City</label>
                            <input
                                type="text"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                placeholder="e.g. Vijayawada"
                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">To City</label>
                            <input
                                type="text"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                placeholder="e.g. Guntur"
                                className="w-full bg-white/5 border border-white/10 h-14 px-5 rounded-xl outline-none focus:border-orange-500 text-white font-medium"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Find Buses'}
                            {!loading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        </button>
                    </form>
                </div>

                <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    {hasSearched && (
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Results ({results.length})
                            </h2>
                        </div>
                    )}

                    {!hasSearched && (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                            <div className="text-5xl mb-4 opacity-20">🔍</div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Enter cities to start searching</p>
                        </div>
                    )}

                    {results.map((bus) => (
                        <div key={bus.id} className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 hover:border-orange-500/50 transition-colors group">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    🚍
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white mb-1 uppercase tracking-tight">{bus.busNumber}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-2 py-0.5 bg-orange-500/10 rounded-full">{bus.routeType}</span>
                                        <span className="text-xs text-slate-500 font-medium">{bus.sourceCity} → {bus.destinationCity}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/track?bus=${bus.busNumber}`)}
                                className="w-full md:w-auto px-8 py-3 bg-white/5 hover:bg-white text-slate-400 hover:text-slate-900 font-bold rounded-xl transition-all border border-white/10"
                            >
                                Track Now
                            </button>
                        </div>
                    ))}

                    {hasSearched && results.length === 0 && (
                        <div className="text-center py-20 bg-red-500/5 border border-red-500/10 rounded-3xl">
                            <div className="text-5xl mb-4 opacity-20">🚫</div>
                            <p className="text-red-400 font-bold uppercase tracking-widest text-xs">No active buses found for this route</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BusSearch;
