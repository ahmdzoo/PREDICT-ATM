import { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Modal from '../Components/Modal';
import {
    Wallet,
    Smartphone,
    TrendingUp,
    AlertTriangle,
    AlertCircle,
    ArrowLeftRight,
    FileSpreadsheet,
    FileText,
    RefreshCw,
    DollarSign,
    CalendarDays,
    BarChart3,
    Info,
    Landmark,
    Plus,
    Loader2,
    X,
    Banknote,
    Building2,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import StatsCard from '../Components/StatsCard';
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

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

async function downloadExport(url, filename) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Download gagal');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    } catch (err) {
        console.error('Download error:', err);
    }
}

const tipeGradients = { 'kas': 'from-emerald-500 to-emerald-600', 'e-wallet': 'from-purple-500 to-indigo-600', 'bank': 'from-blue-500 to-cyan-600' };
const tipeIcons = { 'kas': Wallet, 'e-wallet': Smartphone, 'bank': Landmark };

export default function Dashboard() {
    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const [selectedBranch, setSelectedBranch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [masterBanks, setMasterBanks] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedTopupBank, setSelectedTopupBank] = useState('');
    const [selectedTopupBranch, setSelectedTopupBranch] = useState('');
    const [cashAmount, setCashAmount] = useState('');
    const [cashSaving, setCashSaving] = useState(false);
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [detailBank, setDetailBank] = useState(null);

    const exportParams = selectedBranch ? `?branch_id=${selectedBranch}` : '';

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = selectedBranch ? { branch_id: selectedBranch } : {};
            const [sumRes, chartRes, txRes, predRes, bankRes] = await Promise.all([
                api.get('/dashboard/summary', { params }),
                api.get('/dashboard/transactions-last-30-days', { params }),
                api.get('/transactions', { params }),
                api.get('/prediction/current', { params }),
                api.get('/master-banks'),
            ]);
            setSummary(sumRes.data.data);
            setChartData(chartRes.data.data || []);
            setTransactions((txRes.data.data || []).slice(0, 5));
            setPrediction(predRes.data.data);
            const banks = bankRes.data.data || [];
            setMasterBanks(banks);
            const digitalBanks = banks.filter(b => b.tipe !== 'kas' && b.is_active !== false);
            if (digitalBanks.length > 0 && !selectedTopupBank) {
                setSelectedTopupBank(digitalBanks[0].id);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOwner) {
            api.get('/branches').then((res) => setBranches(res.data.data || [])).catch(() => {});
        }
    }, []);

    useEffect(() => { fetchData(); }, [selectedBranch]);

    const handleTopup = async () => {
        const amount = Number(cashAmount);
        if (!amount || amount < 50000) {
            toast.error('Minimal topup digital Rp 50.000');
            return;
        }
        if (!selectedTopupBank) {
            toast.error('Pilih sumber dana tujuan');
            return;
        }
        if (isOwner && !selectedTopupBranch) {
            toast.error('Pilih cabang tujuan');
            return;
        }
        setCashSaving(true);
        try {
            const payload = { amount, bank_id: selectedTopupBank };
            if (isOwner) payload.branch_id = selectedTopupBranch;
            await api.post('/topup-digital', payload);
            toast.success('Topup digital berhasil!');
            setShowTopupModal(false);
            setCashAmount('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal topup digital');
        } finally {
            setCashSaving(false);
        }
    };

    const handleRestock = async () => {
        const amount = Number(cashAmount);
        if (!amount || amount < 100000) {
            toast.error('Minimal restock kas Rp 100.000');
            return;
        }
        if (isOwner && !selectedTopupBranch) {
            toast.error('Pilih cabang tujuan');
            return;
        }
        setCashSaving(true);
        try {
            const payload = { amount };
            if (isOwner) payload.branch_id = selectedTopupBranch;
            await api.post('/restock-kas', payload);
            toast.success('Restock kas berhasil!');
            setShowRestockModal(false);
            setCashAmount('');
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal restock kas');
        } finally {
            setCashSaving(false);
        }
    };

    const statusColors = {
        aman: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        warning: 'bg-amber-100 text-amber-700 border-amber-200',
        kritis: 'bg-red-100 text-red-700 border-red-200',
    };

    const statusLabels = {
        aman: 'Likuiditas Aman',
        warning: 'Perlu Waspada',
        kritis: 'Kritis!',
    };

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

    const saldoKas = Number(summary?.saldo_kas_terkini) || 0;
    const saldoDigital = Number(summary?.saldo_digital_terkini) || 0;
    const profitHariIni = Number(summary?.profit_hari_ini) || 0;
    const profitBulanIni = Number(summary?.profit_bulan_ini) || 0;

    return (
        <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Landmark className="w-6 h-6 text-emerald-600" />
                        Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Selamat datang, {user?.name || 'User'}! Pantau kondisi likuiditas bisnis Anda.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isOwner && branches.length > 0 && (
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                className="pl-9 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">Semua Cabang</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Sumber Aset */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Sumber Aset</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {(summary?.sources || []).map((source) => {
                        const Icon = tipeIcons[source.tipe] || Wallet;
                        return (
                            <button
                                key={source.source || source.bank_id}
                                onClick={() => setDetailBank(source)}
                                className={`bg-gradient-to-br ${tipeGradients[source.tipe] || 'from-emerald-500 to-emerald-600'} rounded-xl px-3 py-2.5 text-white shadow-sm text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${summary?.is_all_branches ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white/15 rounded-lg flex-shrink-0">
                                        <Icon className="w-3 h-3" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-white/70 uppercase tracking-wider leading-tight">{source.label}</p>
                                        <p className="text-xs font-bold mt-0.5 leading-tight">{formatRupiah(source.saldo)}</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Profit & Total */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatsCard
                    icon={TrendingUp}
                    label="Profit Hari Ini"
                    value={formatRupiah(profitHariIni)}
                    color="emerald"
                />
                <StatsCard
                    icon={TrendingUp}
                    label="Profit Bulan Ini"
                    value={formatRupiah(profitBulanIni)}
                    color="blue"
                />
                <StatsCard
                    icon={DollarSign}
                    label="Total Saldo"
                    value={formatRupiah(saldoKas + saldoDigital)}
                    sub={saldoKas + saldoDigital < 0 ? 'Defisit total!' : undefined}
                    color={saldoKas + saldoDigital < 0 ? 'red' : 'amber'}
                />
            </div>

            <div className={`p-4 rounded-xl border ${statusColors[summary?.status_likuiditas] || 'border-gray-200 bg-white'} flex items-center gap-3`}>
                {summary?.status_likuiditas === 'kritis' ? (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                ) : summary?.status_likuiditas === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                ) : (
                    <Info className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                )}
                <span className="text-sm font-medium">
                    Status Likuiditas: {statusLabels[summary?.status_likuiditas] || 'Tidak diketahui'}
                </span>
                {summary?.is_all_branches && (
                    <span className="ml-auto text-xs text-gray-400 bg-white/60 px-2 py-1 rounded-lg">
                        Total {summary.branches?.length || 0} cabang
                    </span>
                )}
            </div>

            {/* Per-Branch Overview — only when "Semua Cabang" */}
            {summary?.is_all_branches && summary?.branches?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-semibold text-gray-900 text-sm">Ringkasan Per Cabang</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {summary.branches.map((b) => {
                            const bStatus = b.saldo_kas < 2000000 || b.saldo_digital < 1000000 ? 'kritis'
                                : b.saldo_kas < 4000000 || b.saldo_digital < 2000000 ? 'warning' : 'aman';
                            return (
                                <div key={b.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                            bStatus === 'kritis' ? 'bg-red-500' :
                                            bStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        <span className="font-medium text-gray-900 text-sm truncate">{b.name}</span>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">{b.transaksi_hari_ini} tx hari ini</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase">Kas</p>
                                            <p className={`font-semibold ${b.saldo_kas < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                                {formatRupiah(b.saldo_kas)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 uppercase">Digital</p>
                                            <p className={`font-semibold ${b.saldo_digital < 0 ? 'text-red-500' : 'text-gray-800'}`}>
                                                {formatRupiah(b.saldo_digital)}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                            bStatus === 'kritis' ? 'bg-red-100 text-red-700' :
                                            bStatus === 'warning' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {bStatus === 'kritis' ? 'Kritis' : bStatus === 'warning' ? 'Waspada' : 'Aman'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {prediction && prediction.prediksi_kas !== undefined && (
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-semibold">Prediksi Kebutuhan Likuiditas Besok</h3>
                        <div className="relative group ml-auto">
                            <Info className="w-4 h-4 text-slate-500 cursor-help" />
                            <div className="absolute right-0 top-6 w-72 p-3 bg-slate-700 rounded-lg text-xs text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Prediksi SES dihitung dari histori transaksi sebelumnya menggunakan metode Single Exponential Smoothing. Buffer 20% ditambahkan sebagai bantalan keamanan.
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kas Card */}
                        <div className="bg-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                    <Wallet className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-sm font-semibold text-white">Kebutuhan Kas Fisik</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        Prediksi Transaksi Besok
                                        <span className="relative group">
                                            <Info className="w-3 h-3 text-slate-500 cursor-help" />
                                            <span className="absolute left-0 bottom-5 w-56 p-2 bg-slate-700 rounded text-[10px] text-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Estimasi transaksi tarik tunai berdasarkan SES dari histori
                                            </span>
                                        </span>
                                    </span>
                                    <span className="text-sm font-semibold text-white">{formatRupiah(prediction.prediksi_kas)}</span>
                                </div>

                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-slate-400">Buffer Keamanan 20%</span>
                                    <span className="text-sm font-semibold text-amber-300">{formatRupiah(Math.round(prediction.prediksi_kas * 0.2))}</span>
                                </div>

                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-xs font-medium text-emerald-300">Total Kebutuhan Minimum</span>
                                    <span className="text-base font-bold text-emerald-300">{formatRupiah(Math.round(prediction.prediksi_kas * 1.2))}</span>
                                </div>

                                <div className="border-t border-white/20 pt-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">Saldo Saat Ini</span>
                                        <span className="text-sm font-semibold text-white">{formatRupiah(prediction.saldo_kas_sekarang)}</span>
                                    </div>

                                    {prediction.saldo_kas_sekarang >= Math.round(prediction.prediksi_kas * 1.2) ? (
                                        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 text-center">
                                            <p className="text-emerald-300 text-xs font-semibold">✅ SALDO AMAN</p>
                                            <p className="text-emerald-200/70 text-[10px] mt-0.5">Saldo mencukupi kebutuhan besok</p>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                                            <p className="text-amber-300 text-xs font-semibold text-center">⚠️ PERLU TAMBAHAN SALDO</p>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-500/20">
                                                <span className="text-xs text-amber-200/80">Kekurangan Saldo</span>
                                                <span className="text-sm font-bold text-white">{formatRupiah(Math.max(0, Math.round(prediction.prediksi_kas * 1.2) - prediction.saldo_kas_sekarang))}</span>
                                            </div>
                                            <p className="text-amber-200/60 text-[10px] mt-1">
                                                Siapkan dana {formatRupiah(Math.max(0, Math.round(prediction.prediksi_kas * 1.2) - prediction.saldo_kas_sekarang))} untuk besok
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] text-slate-500">
                                <span>Alpha: {prediction.alpha_kas}</span>
                                <span>MAPE: {prediction.mape_kas}%</span>
                                <span>Data: {prediction.jumlah_data_kas} transaksi</span>
                            </div>
                        </div>

                        {/* Digital Card */}
                        <div className="bg-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-purple-500/20 rounded-lg">
                                    <Smartphone className="w-4 h-4 text-purple-400" />
                                </div>
                                <p className="text-sm font-semibold text-white">Kebutuhan Saldo Digital</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        Prediksi Transaksi Besok
                                        <span className="relative group">
                                            <Info className="w-3 h-3 text-slate-500 cursor-help" />
                                            <span className="absolute left-0 bottom-5 w-56 p-2 bg-slate-700 rounded text-[10px] text-slate-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Estimasi transaksi transfer berdasarkan SES dari histori
                                            </span>
                                        </span>
                                    </span>
                                    <span className="text-sm font-semibold text-white">{formatRupiah(prediction.prediksi_digital)}</span>
                                </div>

                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-slate-400">Buffer Keamanan 20%</span>
                                    <span className="text-sm font-semibold text-amber-300">{formatRupiah(Math.round(prediction.prediksi_digital * 0.2))}</span>
                                </div>

                                <div className="flex justify-between items-center pb-2">
                                    <span className="text-xs font-medium text-purple-300">Total Kebutuhan Minimum</span>
                                    <span className="text-base font-bold text-purple-300">{formatRupiah(Math.round(prediction.prediksi_digital * 1.2))}</span>
                                </div>

                                <div className="border-t border-white/20 pt-3 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">Saldo Saat Ini</span>
                                        <span className="text-sm font-semibold text-white">{formatRupiah(prediction.saldo_digital_sekarang)}</span>
                                    </div>

                                    {prediction.saldo_digital_sekarang >= Math.round(prediction.prediksi_digital * 1.2) ? (
                                        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 text-center">
                                            <p className="text-emerald-300 text-xs font-semibold">✅ SALDO AMAN</p>
                                            <p className="text-emerald-200/70 text-[10px] mt-0.5">Saldo mencukupi kebutuhan besok</p>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                                            <p className="text-amber-300 text-xs font-semibold text-center">⚠️ PERLU TAMBAHAN SALDO</p>
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-amber-500/20">
                                                <span className="text-xs text-amber-200/80">Kekurangan Saldo</span>
                                                <span className="text-sm font-bold text-white">{formatRupiah(Math.max(0, Math.round(prediction.prediksi_digital * 1.2) - prediction.saldo_digital_sekarang))}</span>
                                            </div>
                                            <p className="text-amber-200/60 text-[10px] mt-1">
                                                Siapkan dana {formatRupiah(Math.max(0, Math.round(prediction.prediksi_digital * 1.2) - prediction.saldo_digital_sekarang))} untuk besok
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] text-slate-500">
                                <span>Alpha: {prediction.alpha_digital}</span>
                                <span>MAPE: {prediction.mape_digital}%</span>
                                <span>Data: {prediction.jumlah_data_digital} transaksi</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {prediction && prediction.message && (
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Info className="w-5 h-5 text-amber-500" />
                        <p className="text-sm">{prediction.message}</p>
                    </div>
                </div>
            )}

            {/* Cash Management & Branch Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Wallet className="w-4.5 h-4.5 text-emerald-600" />
                        Manajemen Kas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                setShowRestockModal(true);
                                setCashAmount('');
                                if (isOwner && branches.length > 0 && !selectedTopupBranch) {
                                    setSelectedTopupBranch(branches[0].id);
                                }
                            }}
                            className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl text-left hover:shadow-md transition-all group"
                        >
                            <div className="p-2.5 bg-emerald-100 rounded-lg w-fit mb-3 group-hover:bg-emerald-200 transition-colors">
                                <Banknote className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Restock Kas</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Tambah saldo kas fisik dari bank. Minimal Rp 100.000.
                            </p>
                        </button>
                        <button
                            onClick={() => {
                                const digitalBanks = masterBanks.filter(b => b.tipe !== 'kas' && b.is_active !== false);
                                setSelectedTopupBank(digitalBanks[0]?.id || '');
                                setShowTopupModal(true);
                                setCashAmount('');
                                if (isOwner && branches.length > 0 && !selectedTopupBranch) {
                                    setSelectedTopupBranch(branches[0].id);
                                }
                            }}
                            className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl text-left hover:shadow-md transition-all group"
                        >
                            <div className="p-2.5 bg-purple-100 rounded-lg w-fit mb-3 group-hover:bg-purple-200 transition-colors">
                                <Smartphone className="w-5 h-5 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Topup Digital</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Isi ulang saldo digital BRI Link. Minimal Rp 50.000.
                            </p>
                        </button>
                    </div>
                </div>

                {isOwner && (
                    <Link
                        to="/branches"
                        className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all group flex flex-col justify-center"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                <Building2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">Kelola Cabang</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Atur {branches.length} cabang dan kelola admin
                                </p>
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-4.5 h-4.5 text-emerald-600" />
                        Grafik Transaksi 30 Hari Terakhir
                    </h3>
                </div>
                <div className="p-5">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="tanggal"
                                    tickFormatter={(val) => formatDate(val)}
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={{ stroke: '#e5e7eb' }}
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
                                <Bar dataKey="total_tarik" name="Tarik Tunai" fill="#059669" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="total_transfer" name="Transfer" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="total_setor" name="Setor Tunai" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                            Belum ada data transaksi
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => downloadExport(`/api/export/excel${exportParams}`, 'transaksi.xlsx')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </button>
                    <button
                        onClick={() => downloadExport(`/api/export/pdf${exportParams}`, 'transaksi.pdf')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <ArrowLeftRight className="w-4.5 h-4.5 text-emerald-600" />
                        Transaksi Terbaru
                    </h3>
                    <Link to="/transactions" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        Lihat Semua
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-left">
                                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Nominal</th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Kas</th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Digital</th>
                                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                                        Belum ada transaksi
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx, i) => (
                                    <tr key={tx.id || i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                tx.jenis === 'tarik_tunai' ? 'bg-green-100 text-green-700' :
                                                tx.jenis === 'transfer' ? 'bg-purple-100 text-purple-700' :
                                                tx.jenis === 'ppob' ? 'bg-orange-100 text-orange-700' :
                                                tx.jenis === 'topup_digital' ? 'bg-cyan-100 text-cyan-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {tx.jenis?.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 font-medium">{formatRupiah(tx.nominal)}</td>
                                        <td className="px-5 py-3 text-gray-600">{formatRupiah(tx.saldo_kas_setelah)}</td>
                                        <td className="px-5 py-3 text-gray-600">{formatRupiah(tx.saldo_digital_setelah)}</td>
                                        <td className="px-5 py-3 text-gray-400 max-w-[200px] truncate">{tx.keterangan || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Restock Kas */}
            <Modal
                open={showRestockModal}
                onClose={() => { setShowRestockModal(false); setCashAmount(''); }}
                title="Restock Kas"
            >
                <div className="space-y-4">
                    {isOwner && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Cabang</label>
                            <select
                                value={selectedTopupBranch}
                                onChange={(e) => setSelectedTopupBranch(Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                            >
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                        <Wallet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-emerald-800">Sumber: Laci (Kas Fisik)</p>
                            <p className="text-xs text-emerald-600">Restock selalu menambah saldo kas fisik di laci</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (Rp)</label>
                        <input
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="Masukkan jumlah restock"
                            min="100000"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimal Rp 100.000</p>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => { setShowRestockModal(false); setCashAmount(''); }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleRestock}
                            disabled={cashSaving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {cashSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Restock Kas
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Detail Sumber Aset Per Cabang */}
            <Modal
                open={detailBank !== null}
                onClose={() => setDetailBank(null)}
                title={detailBank ? `Detail ${detailBank.label}` : ''}
            >
                {detailBank && (
                    <div className="space-y-4">
                        <div className={`bg-gradient-to-br ${tipeGradients[detailBank.tipe] || 'from-emerald-500 to-emerald-600'} rounded-xl p-4 text-white`}>
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const Icon = tipeIcons[detailBank.tipe] || Wallet;
                                    return <Icon className="w-6 h-6" />;
                                })()}
                                <div>
                                    <p className="text-xs text-white/70">Total Saldo</p>
                                    <p className="text-xl font-bold">{formatRupiah(detailBank.saldo)}</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm font-semibold text-gray-700">Detail Per Cabang</p>

                        {summary?.branches?.length > 0 ? (
                            <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                {summary.branches.map((b) => {
                                    const bankSaldo = b.sources?.[detailBank.source] || 0;
                                    const branchDigital = (b.saldo_digital || 0);
                                    const branchKas = (b.saldo_kas || 0);
                                    return (
                                        <div key={b.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                    b.status_likuiditas === 'kritis' ? 'bg-red-500' :
                                                    b.status_likuiditas === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                                                    <p className="text-xs text-gray-400">Kas: {formatRupiah(branchKas)} | Digital: {formatRupiah(branchDigital)}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-sm font-bold ${bankSaldo >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
                                                    {formatRupiah(bankSaldo)}
                                                </p>
                                                <p className="text-[10px] text-gray-400">
                                                    {((bankSaldo / (detailBank.saldo || 1)) * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-6">Pilih "Semua Cabang" untuk melihat detail per cabang</p>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal: Topup Digital */}
            <Modal
                open={showTopupModal}
                onClose={() => { setShowTopupModal(false); setCashAmount(''); }}
                title="Topup Digital"
            >
                <div className="space-y-4">
                    {isOwner && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Cabang</label>
                            <select
                                value={selectedTopupBranch}
                                onChange={(e) => setSelectedTopupBranch(Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                            >
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tujuan Sumber Dana</label>
                        <select
                            value={selectedTopupBank}
                            onChange={(e) => setSelectedTopupBank(Number(e.target.value))}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                            {(masterBanks || []).filter(b => b.tipe !== 'kas' && b.is_active !== false).map((bank) => (
                                <option key={bank.id} value={bank.id}>{bank.nama}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah (Rp)</label>
                        <input
                            type="number"
                            value={cashAmount}
                            onChange={(e) => setCashAmount(e.target.value)}
                            placeholder="Masukkan jumlah topup"
                            min="50000"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimal Rp 50.000</p>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => { setShowTopupModal(false); setCashAmount(''); }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleTopup}
                            disabled={cashSaving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {cashSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Topup Digital
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
