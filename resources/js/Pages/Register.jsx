import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Landmark, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
    const { register } = useAuth();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            await register(form);
            toast.success('Akun berhasil dibuat!');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                const fieldErrors = {};
                Object.keys(data.errors).forEach((key) => {
                    const field = key === 'password_confirmation' ? 'name' : key;
                    fieldErrors[key] = data.errors[key][0];
                });
                setErrors(fieldErrors);
            } else {
                toast.error(data?.message || 'Pendaftaran gagal. Silakan coba lagi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
                </div>
                <div className="relative z-10 text-center max-w-md">
                    <div className="inline-flex p-4 bg-emerald-500/20 rounded-2xl mb-6">
                        <Landmark className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Mini ATM Predict</h1>
                    <p className="text-emerald-200/80 leading-relaxed">
                        Daftar sebagai agen BRI Link dan mulai pantau transaksi
                        serta prediksi kebutuhan kas harian Anda.
                    </p>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <Landmark className="w-8 h-8 text-emerald-600" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Daftar</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        Buat akun baru untuk memulai
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                placeholder="Nama Anda"
                                required
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                placeholder="nama@email.com"
                                required
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none pr-10 ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Minimal 8 karakter"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                            <input
                                type="password"
                                value={form.password_confirmation}
                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none ${errors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                placeholder="Ulangi password"
                                required
                            />
                            {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-60 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                            ) : (
                                'Daftar'
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-8">
                        Sudah punya akun?{' '}
                        <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                            Masuk
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
