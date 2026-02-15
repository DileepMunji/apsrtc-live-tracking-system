import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        licenseNumber: '',
        busNumber: '',
        routeType: 'both',
        homeCity: '',
        operatingCities: []
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCityToggle = (city) => {
        setFormData(prev => ({
            ...prev,
            operatingCities: prev.operatingCities.includes(city)
                ? prev.operatingCities.filter(c => c !== city)
                : [...prev.operatingCities, city]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters!');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/register', {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                licenseNumber: formData.licenseNumber,
                busNumber: formData.busNumber || null,
                routeType: formData.routeType,
                homeCity: formData.homeCity || null,
                operatingCities: formData.operatingCities
            });

            toast.success(response.data.message);

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                licenseNumber: '',
                busNumber: '',
                routeType: 'both',
                homeCity: '',
                operatingCities: []
            });

            // Redirect to home after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Driver Registration</h2>
                    <p className="text-slate-600">Create your account to start tracking</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/50 p-8 border border-white/50">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div className="relative">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                Full Name
                            </label>
                        </div>

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

                        {/* Phone Field */}
                        <div className="relative">
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                pattern="[0-9]{10}"
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                Phone Number (10 digits)
                            </label>
                        </div>

                        {/* License Number Field */}
                        <div className="relative">
                            <input
                                type="text"
                                name="licenseNumber"
                                value={formData.licenseNumber}
                                onChange={handleChange}
                                required
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium uppercase"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                License Number
                            </label>
                        </div>

                        {/* Bus Number Field (Optional) */}
                        <div className="relative">
                            <input
                                type="text"
                                name="busNumber"
                                value={formData.busNumber}
                                onChange={handleChange}
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium uppercase"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                Bus Number (Optional)
                            </label>
                        </div>

                        {/* Route Type Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Route Type</label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, routeType: 'city', operatingCities: [] })}
                                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${formData.routeType === 'city'
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    🚌 City
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, routeType: 'express', homeCity: '' })}
                                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${formData.routeType === 'express'
                                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    🚍 Express
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, routeType: 'both' })}
                                    className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${formData.routeType === 'both'
                                            ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    Both
                                </button>
                            </div>
                        </div>

                        {/* Conditional Fields Based on Route Type */}
                        {(formData.routeType === 'city' || formData.routeType === 'both') && (
                            <div className="relative">
                                <select
                                    name="homeCity"
                                    value={formData.homeCity}
                                    onChange={handleChange}
                                    required={formData.routeType === 'city'}
                                    className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all text-slate-800 font-medium"
                                >
                                    <option value="">Select Home City</option>
                                    <option value="Visakhapatnam">Visakhapatnam</option>
                                    <option value="Vijayawada">Vijayawada</option>
                                    <option value="Guntur">Guntur</option>
                                    <option value="Tirupati">Tirupati</option>
                                    <option value="Kakinada">Kakinada</option>
                                    <option value="Rajahmundry">Rajahmundry</option>
                                    <option value="Nellore">Nellore</option>
                                    <option value="Kurnool">Kurnool</option>
                                </select>
                                <label className="absolute left-4 top-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
                                    Home City {formData.routeType === 'city' && '*'}
                                </label>
                            </div>
                        )}

                        {(formData.routeType === 'express' || formData.routeType === 'both') && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-orange-600 uppercase tracking-wider">
                                    Operating Cities {formData.routeType === 'express' && '(Select Multiple)'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Kakinada', 'Rajahmundry', 'Nellore', 'Kurnool'].map(city => (
                                        <button
                                            key={city}
                                            type="button"
                                            onClick={() => handleCityToggle(city)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formData.operatingCities.includes(city)
                                                    ? 'bg-orange-500 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

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

                        {/* Confirm Password Field */}
                        <div className="relative">
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="peer w-full px-4 pt-6 pb-2 rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100/50 outline-none transition-all text-slate-800 font-medium"
                                placeholder=" "
                            />
                            <label className="absolute left-4 top-2 text-xs font-bold text-slate-500 uppercase tracking-wider transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:font-normal peer-focus:top-2 peer-focus:text-xs peer-focus:font-bold peer-focus:text-orange-600">
                                Confirm Password
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
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-slate-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/')}
                                className="text-orange-600 font-bold hover:text-orange-700 transition-colors"
                            >
                                Back to Home
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
