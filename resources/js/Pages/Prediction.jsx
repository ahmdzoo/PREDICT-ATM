import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import {
    TrendingUp,
    Wallet,
    Smartphone,
    BarChart3,
    Info,
    AlertTriangle,
    RefreshCw,
    Calculator,
    Activity,
    ChevronDown,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import LoadingSpinner from '../Components/LoadingSpinner';
import ErrorState from '../Components/ErrorState';

function formatRupiah(angka) {
    if (angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(angka);
}

export default function Prediction() {
    const [searchParams] = useSearchParams();
    const branchFilter = searchParams.get('branch_id');

    const [prediction, setPrediction] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('current');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (branchFilter) params.branch_id = branchFilter;
            const [predRes, chartRes] = await Promise.all([
                api.get('/prediction/current', { params }),
                api.get('/prediction/chart', { params }),
            ]);
            setPrediction(predRes.data.data);
            setChartData(chartRes.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data prediksi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [branchFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchData} />;
    }

    const chartLabels = chartData?.labels || [];
    const chartActuals = chartData?.actuals || [];
    const chartForecasts = chartData?.forecasts || [];

    const chartRecharts = chartLabels.map((label, i) => ({
        label,
        Aktual: chartActuals[i] || null,
        Prediksi: chartForecasts[i] || null,
    }));

    const mapeKas = prediction?.mape_kas || 0;
    const mapeDigital = prediction?.mape_digital || 0;

    const accuracyLabel = (mape) => {
        if (mape < 20) return { text: 'Sangat Akurat', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
        if (mape < 50) return { text: 'Cukup Akurat', color: 'text-amber-600 bg-amber-50 border-amber-200' };
        return { text: 'Kurang Akurat', color: 'text-red-600 bg-red-50 border-red-200' };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                        Prediksi SES
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Single Exponential Smoothing &mdash; Prediksi kebutuhan kas dan saldo digital
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('current')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'current' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <BarChart3 className="w-4 h-4 inline mr-1.5" />
                    Prediksi Saat Ini
                </button>
                <button
                    onClick={() => setActiveTab('method')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'method' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Activity className="w-4 h-4 inline mr-1.5" />
                    Tentang Metode
                </button>
            </div>

            {activeTab === 'current' && (
                <>
                    {prediction?.message && !prediction?.prediksi_kas && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Info className="w-5 h-5 text-amber-500" />
                                <p className="text-sm">{prediction.message}</p>
                            </div>
                        </div>
                    )}

                    {prediction && prediction.prediksi_kas !== undefined && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Wallet className="w-4.5 h-4.5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Prediksi Tarik Tunai (Kas)</p>
                                            <p className="text-xs text-gray-500">Single Exponential Smoothing</p>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 mb-2">
                                        {formatRupiah(prediction.prediksi_kas)}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Alpha Optimal</span>
                                            <span className="font-medium">{prediction.alpha_kas}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">MAPE</span>
                                            <span className="font-medium">{prediction.mape_kas}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Akurasi</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${accuracyLabel(mapeKas).color}`}>
                                                {accuracyLabel(mapeKas).text}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Data Historis</span>
                                            <span className="font-medium">{prediction.jumlah_data_kas} transaksi</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Saldo Kas Saat Ini</span>
                                            <span className="font-medium">{formatRupiah(prediction.saldo_kas_sekarang)}</span>
                                        </div>
                                    </div>
                                    {prediction.rekomendasi_kas > 0 && (
                                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-amber-800 text-xs font-semibold flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> REKOMENDASI
                                            </p>
                                            <p className="text-amber-700 text-sm mt-0.5">
                                                Siapkan tambahan kas: {formatRupiah(prediction.rekomendasi_kas)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 bg-purple-100 rounded-lg">
                                            <Smartphone className="w-4.5 h-4.5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Prediksi Transfer (Digital)</p>
                                            <p className="text-xs text-gray-500">Single Exponential Smoothing</p>
                                        </div>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 mb-2">
                                        {formatRupiah(prediction.prediksi_digital)}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Alpha Optimal</span>
                                            <span className="font-medium">{prediction.alpha_digital}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">MAPE</span>
                                            <span className="font-medium">{prediction.mape_digital}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Akurasi</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${accuracyLabel(mapeDigital).color}`}>
                                                {accuracyLabel(mapeDigital).text}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Data Historis</span>
                                            <span className="font-medium">{prediction.jumlah_data_digital} transaksi</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Saldo Digital Saat Ini</span>
                                            <span className="font-medium">{formatRupiah(prediction.saldo_digital_sekarang)}</span>
                                        </div>
                                    </div>
                                    {prediction.rekomendasi_digital > 0 && (
                                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                            <p className="text-amber-800 text-xs font-semibold flex items-center gap-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> REKOMENDASI
                                            </p>
                                            <p className="text-amber-700 text-sm mt-0.5">
                                                Siapkan tambahan saldo digital: {formatRupiah(prediction.rekomendasi_digital)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="p-5 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
                                        Grafik Perbandingan Aktual vs Prediksi (Tarik Tunai)
                                    </h3>
                                </div>
                                <div className="p-5">
                                    {chartRecharts.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={360}>
                                            <LineChart data={chartRecharts} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="label"
                                                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                                                    axisLine={{ stroke: '#e5e7eb' }}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} />
                                                <Tooltip
                                                    formatter={(value) => formatRupiah(value)}
                                                    contentStyle={{
                                                        borderRadius: '8px',
                                                        border: '1px solid #e5e7eb',
                                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                    }}
                                                />
                                                <Legend />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Aktual"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    dot={{ r: 4, fill: '#3b82f6' }}
                                                    connectNulls
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="Prediksi"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={2}
                                                    strokeDasharray="6 3"
                                                    dot={{ r: 3, fill: '#8b5cf6' }}
                                                    connectNulls
                                                />
                                                {chartRecharts.length > 1 && (
                                                    <ReferenceLine
                                                        x={chartLabels[chartLabels.length - 1]}
                                                        stroke="#d1d5db"
                                                        strokeDasharray="4 2"
                                                        label={{ value: 'Besok', position: 'top', fill: '#9ca3af', fontSize: 11 }}
                                                    />
                                                )}
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                                            Data belum cukup untuk grafik (minimal 3 transaksi)
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <Calculator className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-semibold text-gray-900">Ringkasan Prediksi</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-gray-500">Prediksi Tarik Tunai</p>
                                <p className="font-bold text-gray-900">{formatRupiah(prediction?.prediksi_kas || 0)}</p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-gray-500">Prediksi Transfer</p>
                                <p className="font-bold text-gray-900">{formatRupiah(prediction?.prediksi_digital || 0)}</p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-gray-500">Total Prediksi</p>
                                <p className="font-bold text-gray-900">
                                    {formatRupiah((prediction?.prediksi_kas || 0) + (prediction?.prediksi_digital || 0))}
                                </p>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3">
                                <p className="text-gray-500">Buffer Keamanan</p>
                                <p className="font-bold text-gray-900">20%</p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'method' && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Single Exponential Smoothing (SES)</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Single Exponential Smoothing adalah metode peramalan deret waktu yang memberikan bobot
                            lebih besar pada data terbaru. Metode ini cocok untuk data yang tidak memiliki tren
                            atau musiman yang jelas.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Rumus</h4>
                        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                            F<tspan font-size="10" dy="-3">t+1</tspan> = &alpha; &times; Y<tspan font-size="10" dy="-3">t</tspan> + (1 - &alpha;) &times; F<tspan font-size="10" dy="-3">t</tspan>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Alpha (&alpha;)</p>
                            <p className="text-sm text-gray-700 mt-1">
                                Konstanta smoothing (0 &ndash; 1). Nilai optimal dicari secara otomatis dengan membandingkan MAPE.
                            </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4">
                            <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider">MAPE</p>
                            <p className="text-sm text-gray-700 mt-1">
                                Mean Absolute Percentage Error. Mengukur akurasi prediksi. Semakin kecil semakin baik.
                            </p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-4">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Buffer 20%</p>
                            <p className="text-sm text-gray-700 mt-1">
                                Rekomendasi ditambah 20% dari prediksi sebagai bantalan keamanan likuiditas.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-2">Interpretasi MAPE</h4>
                        <div className="space-y-2">
                            {[
                                { range: '&lt; 10%', label: 'Sangat Akurat', color: 'text-emerald-700 bg-emerald-50' },
                                { range: '10% &ndash; 20%', label: 'Akurat', color: 'text-green-700 bg-green-50' },
                                { range: '20% &ndash; 50%', label: 'Cukup Akurat', color: 'text-amber-700 bg-amber-50' },
                                { range: '&gt; 50%', label: 'Kurang Akurat', color: 'text-red-700 bg-red-50' },
                            ].map((item) => (
                                <div key={item.range} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${item.color}`}>
                                    <span className="font-mono text-xs font-semibold w-24">{item.range}</span>
                                    <span className="text-sm">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
