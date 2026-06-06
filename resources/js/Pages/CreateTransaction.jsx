import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
    ArrowLeft,
    ArrowLeftRight,
    Wallet,
    ArrowUpDown,
    Smartphone,
    Banknote,
    Landmark,
    CheckCircle,
    PlusCircle,
    ArrowRight,
    Calculator,
    Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../Components/LoadingSpinner';

function formatRupiah(angka) {
    if (angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(angka);
}

const jenisOptions = [
    { value: 'tarik_tunai', label: 'Tarik Tunai', icon: Wallet, color: 'bg-green-100 text-green-700', iconColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', desc: 'Nasabah mengambil uang tunai', effect: 'Menambah digital, mengurangi kas', allowedTipe: ['bank', 'e-wallet'], biayaAdminDefault: 1500 },
    { value: 'transfer', label: 'Transfer', icon: ArrowUpDown, color: 'bg-purple-100 text-purple-700', iconColor: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', desc: 'Transfer dari saldo digital', effect: 'Menambah kas, mengurangi digital', allowedTipe: ['bank', 'e-wallet'], biayaAdminDefault: 3500 },
    { value: 'ppob', label: 'PPOB', icon: Smartphone, color: 'bg-orange-100 text-orange-700', iconColor: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', desc: 'Pembayaran tagihan', effect: 'Mengurangi saldo digital', allowedTipe: ['bank', 'e-wallet'], biayaAdminDefault: 2500 },
    { value: 'topup_digital', label: 'Topup Digital', icon: Banknote, color: 'bg-cyan-100 text-cyan-700', iconColor: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', desc: 'Isi ulang saldo digital', effect: 'Menambah saldo digital', allowedTipe: ['bank', 'e-wallet'], biayaAdminDefault: 0 },
    { value: 'restock_kas', label: 'Restock Kas', icon: Banknote, color: 'bg-rose-100 text-rose-700', iconColor: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', desc: 'Tambah kas dari bank', effect: 'Menambah saldo kas fisik', allowedTipe: ['kas'], biayaAdminDefault: 0 },
];

const bankIconMap = { 'kas': Wallet, 'e-wallet': Smartphone, 'bank': Landmark };

const defaultForm = { jenis: 'tarik_tunai', bank_id: '', nominal: '', biaya_admin: 1500, keterangan: '' };

export default function CreateTransaction() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const jenisFromUrl = searchParams.get('jenis');

    const [masterBanks, setMasterBanks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ ...defaultForm });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const getFilteredBanks = (jenis) => {
        const cfg = jenisOptions.find(o => o.value === jenis);
        if (!cfg) return [];
        return (masterBanks || []).filter(b => b.is_active !== false && cfg.allowedTipe.includes(b.tipe));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, bankRes] = await Promise.all([
                    api.get('/transactions'),
                    api.get('/master-banks'),
                ]);
                setTransactions(txRes.data.data || []);
                setMasterBanks(bankRes.data.data || []);
            } catch {
                // silent
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (masterBanks.length > 0 && jenisFromUrl) {
            const cfg = jenisOptions.find(o => o.value === jenisFromUrl);
            const filtered = getFilteredBanks(jenisFromUrl);
            setForm({
                jenis: jenisFromUrl,
                bank_id: filtered[0]?.id || '',
                nominal: '',
                biaya_admin: cfg?.biayaAdminDefault || 0,
                keterangan: '',
            });
        }
    }, [jenisFromUrl, masterBanks]);

    const lastTx = transactions[0];
    const currentKas = lastTx ? Number(lastTx.saldo_kas_setelah) : 5000000;
    const currentDigital = lastTx ? Number(lastTx.saldo_digital_setelah) : 3000000;

    const validateForm = () => {
        const errs = {};
        if (!form.jenis) errs.jenis = 'Pilih jenis transaksi';
        if (!form.bank_id) errs.bank_id = 'Pilih sumber dana';
        if (!form.nominal || form.nominal < 1) errs.nominal = 'Masukkan nominal';
        if (form.jenis === 'topup_digital' && Number(form.nominal) < 50000) errs.nominal = 'Minimal topup digital Rp 50.000';
        if (form.jenis === 'restock_kas' && Number(form.nominal) < 100000) errs.nominal = 'Minimal restock kas Rp 100.000';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const payload = {
                jenis: form.jenis,
                bank_id: form.bank_id,
                nominal: Number(form.nominal),
                biaya_admin: form.biaya_admin !== '' ? Number(form.biaya_admin) : 0,
                keterangan: form.keterangan || '',
            };

            await api.post('/transactions', payload);
            toast.success('Transaksi berhasil ditambahkan');
            navigate('/transactions');
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                const fieldErrors = {};
                Object.keys(data.errors).forEach((key) => {
                    fieldErrors[key] = data.errors[key][0];
                });
                setFormErrors(fieldErrors);
            } else {
                toast.error(data?.message || 'Gagal menyimpan transaksi');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/transactions')}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Buat Transaksi</h1>
                    <p className="text-sm text-gray-500">Input transaksi baru</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Type selector */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-1">Pilih Jenis Transaksi</h3>
                        <p className="text-sm text-gray-500 mb-4">Pilih tipe transaksi yang akan dilakukan</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {jenisOptions.map((o) => {
                                const Icon = o.icon;
                                const selected = form.jenis === o.value;
                                return (
                                    <button
                                        key={o.value}
                                        onClick={() => {
                                            const filtered = getFilteredBanks(o.value);
                                            setForm({ ...form, jenis: o.value, bank_id: filtered[0]?.id || '', biaya_admin: o.biayaAdminDefault, nominal: '', keterangan: '' });
                                            setFormErrors({});
                                        }}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                                            selected
                                                ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500/20'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {selected && (
                                            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                        <div className={`p-2.5 rounded-lg w-fit mb-3 ${selected ? o.bgColor : 'bg-gray-50'}`}>
                                            <Icon className={`w-5 h-5 ${o.iconColor}`} />
                                        </div>
                                        <p className={`text-sm font-semibold ${selected ? 'text-emerald-700' : 'text-gray-800'}`}>{o.label}</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{o.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                        {formErrors.jenis && <p className="text-red-500 text-xs mt-2">{formErrors.jenis}</p>}
                    </div>

                    {/* Source selector */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-semibold text-gray-900 mb-1">Sumber Dana</h3>
                        <p className="text-sm text-gray-500 mb-4">Pilih sumber dana transaksi</p>
                        {(() => {
                            const filtered = getFilteredBanks(form.jenis);
                            const isSingle = filtered.length <= 1;
                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {filtered.map((bank) => {
                                        const Icon = bankIconMap[bank.tipe] || Landmark;
                                        const selected = form.bank_id === bank.id;
                                        return (
                                            <button
                                                key={bank.id}
                                                onClick={() => { setForm({ ...form, bank_id: bank.id }); setFormErrors({}); }}
                                                disabled={isSingle}
                                                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                                                    selected
                                                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500/20'
                                                        : isSingle
                                                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-80'
                                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                                                }`}
                                            >
                                                {selected && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                )}
                                                <div className={`p-2.5 rounded-lg w-fit mb-3 ${selected ? 'bg-emerald-100' : 'bg-gray-50'}`}>
                                                    <Icon className={`w-5 h-5 ${selected ? 'text-emerald-600' : 'text-gray-500'}`} />
                                                </div>
                                                <p className={`text-sm font-semibold ${selected ? 'text-emerald-700' : 'text-gray-800'}`}>{bank.nama}</p>
                                                {isSingle && (
                                                    <p className="text-[11px] text-amber-600 mt-0.5 font-medium">Hanya {bank.nama}</p>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {formErrors.bank_id && <p className="text-red-500 text-xs mt-1.5">{formErrors.bank_id}</p>}
                    </div>

                    {/* Nominal & Keterangan */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal Transaksi</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rp</div>
                                <input
                                    type="number"
                                    value={form.nominal}
                                    onChange={(e) => { setForm({ ...form, nominal: e.target.value }); setFormErrors({}); }}
                                    placeholder="0"
                                    min="1000"
                                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all ${
                                        formErrors.nominal ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                />
                            </div>
                            {form.jenis === 'topup_digital' && <p className="text-xs text-cyan-600 mt-1.5">Minimal topup digital Rp 50.000</p>}
                            {form.jenis === 'restock_kas' && <p className="text-xs text-rose-600 mt-1.5">Minimal restock kas Rp 100.000</p>}
                            {!['topup_digital', 'restock_kas'].includes(form.jenis) && <p className="text-xs text-gray-400 mt-1.5">Minimal Rp 1.000</p>}
                            {formErrors.nominal && <p className="text-red-500 text-xs mt-1.5">{formErrors.nominal}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Biaya Admin / Profit</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">Rp</div>
                                <input
                                    type="number"
                                    value={form.biaya_admin}
                                    onChange={(e) => { setForm({ ...form, biaya_admin: e.target.value }); }}
                                    placeholder="0"
                                    min="0"
                                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none hover:border-gray-300 transition-all"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1.5">Biaya yang dibebankan kepada nasabah (otomatis sesuai jenis transaksi)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
                            <input
                                type="text"
                                value={form.keterangan}
                                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                                placeholder="Deskripsi transaksi (contoh: Tarik tunai oleh nasabah)"
                                maxLength={500}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none hover:border-gray-300 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Summary sidebar */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg sticky top-6">
                        <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
                            <Calculator className="w-4 h-4 text-emerald-400" />
                            Ringkasan Transaksi
                        </h3>
                        <p className="text-xs text-slate-400 mb-5">Pratinjau perubahan saldo</p>

                        <div className="space-y-3">
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    {(() => {
                                        const cfg = jenisOptions.find(o => o.value === form.jenis);
                                        const Icon = cfg?.icon || ArrowLeftRight;
                                        return (
                                            <>
                                                <div className={`p-1.5 rounded ${form.jenis ? cfg.bgColor.replace('bg-', 'bg-').replace('50', '500/20') : 'bg-white/10'}`}>
                                                    <Icon className={`w-3.5 h-3.5 ${form.jenis ? cfg.iconColor : 'text-slate-400'}`} />
                                                </div>
                                                <span className="text-sm font-medium">{form.jenis ? jenisOptions.find(o => o.value === form.jenis).label : 'Pilih jenis'}</span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Nominal</span>
                                    <span className="font-semibold text-white">{form.nominal ? formatRupiah(Number(form.nominal)) : '-'}</span>
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-slate-400">Efek</span>
                                    <span className="font-semibold text-amber-300">{jenisOptions.find(o => o.value === form.jenis)?.effect || '-'}</span>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Saldo Kas Saat Ini</span>
                                    <span className="font-medium text-white">{formatRupiah(currentKas)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Saldo Digital Saat Ini</span>
                                    <span className="font-medium text-white">{formatRupiah(currentDigital)}</span>
                                </div>
                            </div>

                            {form.nominal > 0 && form.jenis && (() => {
                                const nominal = Number(form.nominal);
                                let newKas = currentKas;
                                let newDigital = currentDigital;
                                switch (form.jenis) {
                                    case 'tarik_tunai': newDigital += nominal; newKas -= nominal; break;
                                    case 'transfer': newKas += nominal; newDigital -= nominal; break;
                                    case 'ppob': newDigital -= nominal; break;
                                    case 'topup_digital': newDigital += nominal; break;
                                    case 'restock_kas': newKas += nominal; break;
                                }
                                return (
                                    <div className="border-t border-white/10 pt-3 space-y-2">
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium mb-2">
                                            <ArrowRight className="w-3 h-3" /> Setelah Transaksi
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Kas</span>
                                            <span className={`font-semibold ${newKas < 0 ? 'text-red-400' : 'text-white'}`}>{formatRupiah(newKas)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Digital</span>
                                            <span className={`font-semibold ${newDigital < 0 ? 'text-red-400' : 'text-white'}`}>{formatRupiah(newDigital)}</span>
                                        </div>
                                        {(newKas < 0 || newDigital < 0) && (
                                            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 mt-2">
                                                <p className="text-red-300 text-[10px] font-semibold">⚠️ Saldo tidak mencukupi</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || !form.jenis || !form.nominal}
                            className="w-full mt-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                            ) : (
                                <><PlusCircle className="w-4 h-4" /> Buat Transaksi</>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                        <p className="font-semibold mb-1">💡 Informasi</p>
                        <p>Saldo akan dihitung ulang secara otomatis setelah transaksi dibuat untuk memastikan akurasi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
