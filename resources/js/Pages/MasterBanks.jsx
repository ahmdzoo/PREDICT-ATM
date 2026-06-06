import { useState, useEffect } from 'react';
import api from '../api/client';
import Modal from '../Components/Modal';
import {
    Landmark,
    Plus,
    Pencil,
    Loader2,
    RefreshCw,
    Banknote,
    Smartphone,
    Building2,
    Wallet,
    CheckCircle,
    XCircle,
    Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../Components/LoadingSpinner';
import ErrorState from '../Components/ErrorState';

const tipeConfig = {
    'kas': { label: 'Kas', icon: Wallet, color: 'bg-emerald-100 text-emerald-700', iconColor: 'text-emerald-600' },
    'e-wallet': { label: 'E-Wallet', icon: Smartphone, color: 'bg-purple-100 text-purple-700', iconColor: 'text-purple-600' },
    'bank': { label: 'Bank', icon: Landmark, color: 'bg-blue-100 text-blue-700', iconColor: 'text-blue-600' },
};

function formatRupiah(angka) {
    if (angka === null || angka === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(angka);
}

const defaultForm = {
    nama: '',
    kode: '',
    tipe: 'bank',
    saldo_awal: '',
    keterangan: '',
    terapkan_ke_semua: false,
};

export default function MasterBanks() {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editingBank, setEditingBank] = useState(null);
    const [form, setForm] = useState({ ...defaultForm });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/master-banks');
            setBanks(res.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data master bank');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreate = () => {
        setEditingBank(null);
        setForm({ ...defaultForm });
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (bank) => {
        setEditingBank(bank);
        setForm({
            nama: bank.nama,
            kode: bank.kode,
            tipe: bank.tipe,
            saldo_awal: bank.saldo_awal,
            keterangan: bank.keterangan || '',
            terapkan_ke_semua: false,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBank(null);
    };

    const validateForm = () => {
        const errs = {};
        if (!form.nama.trim()) errs.nama = 'Nama platform harus diisi';
        if (!form.kode.trim()) errs.kode = 'Kode harus diisi';
        else if (!/^[a-z0-9_]+$/.test(form.kode)) errs.kode = 'Kode hanya boleh huruf kecil, angka, dan underscore';
        if (!form.tipe) errs.tipe = 'Pilih tipe saldo';
        if (!form.saldo_awal || Number(form.saldo_awal) < 0) errs.saldo_awal = 'Saldo awal harus diisi (min 0)';
        setFormErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                saldo_awal: Number(form.saldo_awal),
                terapkan_ke_semua: form.terapkan_ke_semua,
            };

            if (editingBank) {
                await api.put(`/master-banks/${editingBank.id}`, payload);
                toast.success('Master bank berhasil diperbarui');
            } else {
                await api.post('/master-banks', payload);
                toast.success('Master bank berhasil ditambahkan');
            }

            closeModal();
            fetchData();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                const fieldErrors = {};
                Object.keys(data.errors).forEach((key) => {
                    fieldErrors[key] = data.errors[key][0];
                });
                setFormErrors(fieldErrors);
            } else {
                toast.error(data?.message || 'Gagal menyimpan master bank');
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

    if (error) {
        return <ErrorState message={error} onRetry={fetchData} />;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Landmark className="w-6 h-6 text-emerald-600" />
                    Master Bank
                </h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Bank
                    </button>
                </div>
            </div>

            {/* Info card */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Sumber Aset / Master Bank</p>
                    <p>Kelola daftar sumber dana yang tersedia. Setiap cabang akan memiliki saldo terpisah untuk setiap bank yang aktif. Tipe saldo menentukan jenis transaksi yang bisa menggunakan bank tersebut.</p>
                </div>
            </div>

            {/* Bank cards */}
            {banks.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
                    <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Belum ada master bank</p>
                    <p className="text-gray-400 text-sm mt-1">Klik "Tambah Bank" untuk menambahkan sumber aset baru</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {banks.map((bank) => {
                        const cfg = tipeConfig[bank.tipe] || { label: bank.tipe, icon: Building2, color: 'bg-gray-100 text-gray-700', iconColor: 'text-gray-600' };
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={bank.id}
                                className={`bg-white rounded-xl border shadow-sm p-5 transition-all hover:shadow-md ${bank.is_active ? 'border-gray-200' : 'border-gray-200 opacity-75'}`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-2.5 rounded-lg ${bank.is_active ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                        <Icon className={`w-5 h-5 ${bank.is_active ? 'text-emerald-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {bank.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                                                <CheckCircle className="w-3 h-3" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                                                <XCircle className="w-3 h-3" /> Nonaktif
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="font-semibold text-gray-900 text-lg">{bank.nama}</h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">Kode: {bank.kode}</p>

                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tipe</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                                            <Icon className="w-3 h-3" /> {cfg.label}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Saldo Awal</span>
                                        <span className="font-semibold text-gray-800">{formatRupiah(bank.saldo_awal)}</span>
                                    </div>
                                    {bank.keterangan && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Keterangan</span>
                                            <span className="text-gray-600 text-right max-w-[200px] truncate">{bank.keterangan}</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => openEdit(bank)}
                                    className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Edit Bank
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Create / Edit */}
            <Modal
                open={showModal}
                onClose={closeModal}
                title={editingBank ? 'Edit Master Bank' : 'Tambah Master Bank'}
            >
                <div className="space-y-4">
                    {/* Tipe Saldo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Saldo</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.entries(tipeConfig).map(([key, cfg]) => {
                                const Icon = cfg.icon;
                                const selected = form.tipe === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => { setForm({ ...form, tipe: key }); setFormErrors({}); }}
                                        disabled={editingBank}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm ${
                                            selected
                                                ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/20'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        } ${editingBank ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${selected ? 'text-emerald-600' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${selected ? 'text-emerald-700' : 'text-gray-600'}`}>{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {formErrors.tipe && <p className="text-red-500 text-xs mt-1">{formErrors.tipe}</p>}
                    </div>

                    {/* Nama Platform */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Platform</label>
                        <input
                            type="text"
                            value={form.nama}
                            onChange={(e) => { setForm({ ...form, nama: e.target.value }); setFormErrors({}); }}
                            placeholder="Contoh: Mandiri, BSI, Jenius"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                                formErrors.nama ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {formErrors.nama && <p className="text-red-500 text-xs mt-1">{formErrors.nama}</p>}
                    </div>

                    {/* Kode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Kode <span className="text-gray-400 font-normal">(identifier unik)</span>
                        </label>
                        <input
                            type="text"
                            value={form.kode}
                            onChange={(e) => { setForm({ ...form, kode: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }); setFormErrors({}); }}
                            placeholder="Contoh: mandiri, bsi"
                            disabled={editingBank}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono ${
                                formErrors.kode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            } ${editingBank ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                        {formErrors.kode && <p className="text-red-500 text-xs mt-1">{formErrors.kode}</p>}
                    </div>

                    {/* Saldo Awal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Saldo Awal (Rp)</label>
                        <input
                            type="number"
                            value={form.saldo_awal}
                            onChange={(e) => { setForm({ ...form, saldo_awal: e.target.value }); setFormErrors({}); }}
                            placeholder="0"
                            min="0"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${
                                formErrors.saldo_awal ? 'border-red-300 bg-red-50' : 'border-gray-300'
                            }`}
                        />
                        {formErrors.saldo_awal && <p className="text-red-500 text-xs mt-1">{formErrors.saldo_awal}</p>}
                        <p className="text-xs text-gray-400 mt-1">Saldo default untuk cabang baru</p>
                    </div>

                    {/* Toggle: Terapkan ke semua cabang */}
                    {!editingBank && (
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, terapkan_ke_semua: !form.terapkan_ke_semua })}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    form.terapkan_ke_semua ? 'bg-emerald-500' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        form.terapkan_ke_semua ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                />
                            </button>
                            <div>
                                <p className="text-sm font-medium text-gray-700">Jadikan saldo awal & terakhir</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Jika aktif, saldo awal akan diterapkan ke <strong>semua cabang</strong> (yang sudah ada maupun baru). Jika tidak, hanya cabang baru yang mendapat saldo awal.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Keterangan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
                        <input
                            type="text"
                            value={form.keterangan}
                            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                            placeholder="Catatan internal"
                            maxLength={500}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingBank ? 'Simpan Perubahan' : 'Tambah Bank'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
