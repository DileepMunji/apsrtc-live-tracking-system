import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            // Redirect to dashboard after successful login
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10"></div>

            <div className="w-full max-w-md animate-fade-in-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">APSRTC</h1>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Driver Login</h2>
                    <p className="text-slate-600">Welcome back! Please login to continue</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 p-8 border border-white/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="relative">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                Email Address
                            </label>
                        </div>

                        {/* Password Field */}
                        <div className="relative">
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                Password
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Login
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center space-y-3">
                        <p className="text-slate-600">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-orange-600 font-bold hover:text-orange-700 transition-colors"
                            >
                                Register here
                            </Link>
                        </p>
                        <Link
                            to="/"
                            className="block text-slate-500 hover:text-slate-700 transition-colors text-sm"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
