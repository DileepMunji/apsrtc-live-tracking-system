import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <span className="block text-lg font-display font-bold text-slate-900">APSRTC</span>
                            <span className="block text-[9px] font-bold text-orange-600 uppercase tracking-widest">Driver Dashboard</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Welcome, {user?.name}! 👋</h1>
                    <p className="text-lg text-slate-600">Your driver dashboard is ready</p>
                </div>

                {/* Driver Info Card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Driver Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">License Number</p>
                            <p className="text-lg font-bold text-slate-900">{user?.licenseNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</p>
                            <p className="text-lg font-bold text-slate-900">{user?.phone}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Route Type</p>
                            <p className="text-lg font-bold text-slate-900 capitalize">
                                {user?.routeType === 'city' && '🚌 City Bus'}
                                {user?.routeType === 'express' && '🚍 Express Bus'}
                                {user?.routeType === 'both' && '🚌🚍 Both'}
                            </p>
                        </div>
                        {user?.busNumber && (
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Bus Number</p>
                                <p className="text-lg font-bold text-slate-900">{user?.busNumber}</p>
                            </div>
                        )}
                        {user?.homeCity && (
                            <div>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Home City</p>
                                <p className="text-lg font-bold text-slate-900">{user?.homeCity}</p>
                            </div>
                        )}
                        {user?.operatingCities && user.operatingCities.length > 0 && (
                            <div className="md:col-span-2">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Operating Cities</p>
                                <div className="flex flex-wrap gap-2">
                                    {user.operatingCities.map((city, index) => (
                                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium text-sm">
                                            {city}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Coming Soon Card */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white text-center">
                    <h2 className="text-3xl font-bold mb-4">🚀 Bus Activation Coming Soon!</h2>
                    <p className="text-lg opacity-90">
                        In Slice 4, you'll be able to activate your bus and start tracking in real-time.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
