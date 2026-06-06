import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Modal from '../Components/Modal';
import {
    Search,
    ArrowLeftRight,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Wallet,
    ArrowUpDown,
    Smartphone,
    Banknote,
    Landmark,
    AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../Components/LoadingSpinner';
import ErrorState from '../Components/ErrorState';

const ITEMS_PER_PAGE = 15;

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
    { value: 'tarik_tunai', label: 'Tarik Tunai' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'ppob', label: 'PPOB' },
    { value: 'topup_digital', label: 'Topup Digital' },
    { value: 'restock_kas', label: 'Restock Kas' },
];

const jenisConfig = {
    tarik_tunai: { label: 'Tarik Tunai', icon: Wallet, color: 'bg-green-100 text-green-700' },
    transfer: { label: 'Transfer', icon: ArrowUpDown, color: 'bg-purple-100 text-purple-700' },
    ppob: { label: 'PPOB', icon: Smartphone, color: 'bg-orange-100 text-orange-700' },
    topup_digital: { label: 'Topup Digital', icon: Banknote, color: 'bg-cyan-100 text-cyan-700' },
    restock_kas: { label: 'Restock Kas', icon: Banknote, color: 'bg-rose-100 text-rose-700' },
};

const bankColorMap = { 'kas': 'bg-emerald-100 text-emerald-700', 'e-wallet': 'bg-purple-100 text-purple-700', 'bank': 'bg-blue-100 text-blue-700' };

export default function Transactions() {
    const [searchParams] = useSearchParams();
    const branchFilter = searchParams.get('branch_id');

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [masterBanks, setMasterBanks] = useState([]);

    const [search, setSearch] = useState('');
    const [jenisFilter, setJenisFilter] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [page, setPage] = useState(1);

    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState(null);
    const [form, setForm] = useState({ jenis: '', bank_id: '', nominal: '', biaya_admin: '', keterangan: '' });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingTx, setDeletingTx] = useState(null);

    const bankMap = Object.fromEntries((masterBanks || []).map(b => [b.id, b]));

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (branchFilter) params.branch_id = branchFilter;
            const [txRes, bankRes] = await Promise.all([
                api.get('/transactions', { params }),
                api.get('/master-banks'),
            ]);
            setTransactions(txRes.data.data || []);
            setMasterBanks(bankRes.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat transaksi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [branchFilter]);

    const filtered = useMemo(() => {
        let data = [...transactions];

        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(
                (tx) =>
                    (tx.jenis && tx.jenis.toLowerCase().includes(q)) ||
                    (tx.keterangan && tx.keterangan.toLowerCase().includes(q)) ||
                    (tx.nominal && tx.nominal.toString().includes(q))
            );
        }

        if (jenisFilter) {
            data = data.filter((tx) => tx.jenis === jenisFilter);
        }

        if (dateStart) {
            data = data.filter((tx) => new Date(tx.created_at) >= new Date(dateStart));
        }

        if (dateEnd) {
            const end = new Date(dateEnd);
            end.setDate(end.getDate() + 1);
            data = data.filter((tx) => new Date(tx.created_at) <= end);
        }

        return data;
    }, [transactions, search, jenisFilter, dateStart, dateEnd]);

    const totalNominal = filtered.reduce((sum, tx) => sum + Number(tx.nominal), 0);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    useEffect(() => {
        setPage(1);
    }, [search, jenisFilter, dateStart, dateEnd]);

    const clearFilters = () => {
        setSearch('');
        setJenisFilter('');
        setDateStart('');
        setDateEnd('');
    };

    /* ── CRUD handlers ── */

    const openEdit = (tx) => {
        setEditingTx(tx);
        const bankId = tx.bank_id || '';
        setForm({
            jenis: tx.jenis,
            bank_id: bankId,
            nominal: tx.nominal,
            biaya_admin: tx.biaya_admin || '',
            keterangan: tx.keterangan || '',
        });
        setFormErrors({});
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTx(null);
    };

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

            await api.put(`/transactions/${editingTx.id}`, payload);
            toast.success('Transaksi berhasil diperbarui');
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
                toast.error(data?.message || 'Gagal menyimpan transaksi');
            }
        } finally {
            setSaving(false);
        }
    };

    const openDelete = (tx) => {
        setDeletingTx(tx);
        setShowDeleteConfirm(true);
    };

    const handleDelete = async () => {
        if (!deletingTx) return;
        try {
            await api.delete(`/transactions/${deletingTx.id}`);
            toast.success('Transaksi berhasil dihapus');
            setShowDeleteConfirm(false);
            setDeletingTx(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus transaksi');
        }
    };

    /* ── Render ── */

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
                    Riwayat Transaksi
                </h1>
                <button
                    onClick={fetchData}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Filter bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-100 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari transaksi..."
                                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <select
                            value={jenisFilter}
                            onChange={(e) => setJenisFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                            <option value="">Semua Jenis</option>
                            {jenisOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        <input
                            type="date"
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                        {(search || jenisFilter || dateStart || dateEnd) && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary bar */}
                {filtered.length > 0 && (
                    <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                        <span className="text-gray-600">
                            <span className="text-gray-400">Total nominal:</span>{' '}
                            <span className="font-semibold text-gray-800">{formatRupiah(totalNominal)}</span>
                        </span>
                        <span className="text-gray-600">
                            <span className="text-gray-400">Rata-rata:</span>{' '}
                            <span className="font-semibold text-gray-800">{formatRupiah(Math.round(totalNominal / filtered.length))}</span>
                        </span>
                        <span className="text-gray-600">
                            <span className="text-gray-400">Total Biaya Admin:</span>{' '}
                            <span className="font-semibold text-gray-800">{formatRupiah(filtered.reduce((s, tx) => s + Number(tx.biaya_admin || 0), 0))}</span>
                        </span>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-800 text-left">
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">#</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">Tanggal</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">Jenis</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">Nominal</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">Biaya Admin</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">Sumber Dana</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">Keterangan</th>
                                <th className="px-5 py-3.5 text-xs font-semibold text-slate-300 uppercase tracking-wider text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <ArrowLeftRight className="w-8 h-8 text-gray-300" />
                                            <p>Tidak ada transaksi ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((tx, i) => {
                                    const cfg = jenisConfig[tx.jenis] || { label: tx.jenis, icon: ArrowLeftRight, color: 'bg-gray-100 text-gray-700' };
                                    const Icon = cfg.icon;
                                    const rowNum = (page - 1) * ITEMS_PER_PAGE + i + 1;
                                    return (
                                        <tr
                                            key={tx.id || i}
                                            className={`transition-colors ${rowNum % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'} hover:bg-emerald-50/40`}
                                        >
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">{rowNum}</td>
                                            <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                                                <span className="font-medium text-gray-700">
                                                    {new Date(tx.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric',
                                                    })}
                                                </span>
                                                <span className="text-gray-400 ml-1.5">
                                                    {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit', minute: '2-digit',
                                                    })}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${cfg.color}`}>
                                                    <Icon className="w-3 h-3" />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-900">{formatRupiah(tx.nominal)}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{tx.biaya_admin ? formatRupiah(tx.biaya_admin) : '-'}</td>
                                            <td className="px-5 py-3.5">
                                                {(() => {
                                                    const bank = bankMap[tx.bank_id];
                                                    const tipe = bank?.tipe || 'bank';
                                                    const bColor = bankColorMap[tipe] || 'bg-gray-100 text-gray-600';
                                                    const label = bank?.nama || tx.source || '-';
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bColor}`}>
                                                            <span className={`w-2 h-2 rounded-full ${tipe === 'kas' ? 'bg-emerald-500' : tipe === 'e-wallet' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                                                            {label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 max-w-[180px] truncate">{tx.keterangan || '-'}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(tx)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                        title="Edit transaksi"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDelete(tx)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                        title="Hapus transaksi"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Halaman <span className="font-medium text-gray-700">{page}</span> dari{' '}
                            <span className="font-medium text-gray-700">{totalPages}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-500" />
                            </button>
                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                                const p = start + i;
                                if (p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                            page === p
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'text-gray-600 hover:bg-white hover:border hover:border-gray-200'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Modal: Edit ── */}
            <Modal
                open={showModal}
                onClose={closeModal}
                title="Edit Transaksi"
            >
                <div className="space-y-4">
                    {/* Jenis */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Jenis Transaksi</label>
                        <select
                            value={form.jenis}
                            onChange={(e) => {
                                const newJenis = e.target.value;
                                setForm({ ...form, jenis: newJenis });
                                setFormErrors({ ...formErrors, jenis: null });
                            }}
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white ${formErrors.jenis ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        >
                            {jenisOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        {formErrors.jenis && <p className="text-red-500 text-xs mt-1">{formErrors.jenis}</p>}
                    </div>

                    {/* Source */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sumber Dana</label>
                        <select
                            value={form.bank_id}
                            onChange={(e) => { setForm({ ...form, bank_id: Number(e.target.value) }); }}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                        >
                            {masterBanks
                                .filter(b => b.is_active !== false)
                                .map((bank) => (
                                    <option key={bank.id} value={bank.id}>{bank.nama}</option>
                                ))}
                        </select>
                        {formErrors.bank_id && <p className="text-red-500 text-xs mt-1">{formErrors.bank_id}</p>}
                    </div>

                    {/* Nominal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                        <input
                            type="number"
                            value={form.nominal}
                            onChange={(e) => {
                                setForm({ ...form, nominal: e.target.value });
                                setFormErrors({ ...formErrors, nominal: null });
                            }}
                            placeholder="Masukkan nominal"
                            min="1000"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${formErrors.nominal ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {formErrors.nominal && <p className="text-red-500 text-xs mt-1">{formErrors.nominal}</p>}
                    </div>

                    {/* Biaya Admin */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Biaya Admin / Profit (Rp)</label>
                        <input
                            type="number"
                            value={form.biaya_admin}
                            onChange={(e) => { setForm({ ...form, biaya_admin: e.target.value }); }}
                            placeholder="0"
                            min="0"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        />
                    </div>

                    {/* Keterangan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan <span className="text-gray-400 font-normal">(opsional)</span></label>
                        <input
                            type="text"
                            value={form.keterangan}
                            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                            placeholder="Deskripsi transaksi"
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
                            Simpan Perubahan
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal: Delete confirmation ── */}
            <Modal
                open={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setDeletingTx(null); }}
                title="Hapus Transaksi"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-700">
                                Yakin ingin menghapus transaksi ini?
                            </p>
                            {deletingTx && (
                                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                                    <p><span className="text-gray-500">Jenis:</span> <span className="font-medium">{deletingTx.jenis?.replace(/_/g, ' ')}</span></p>
                                    <p><span className="text-gray-500">Nominal:</span> <span className="font-medium">{formatRupiah(deletingTx.nominal)}</span></p>
                                    {deletingTx.keterangan && <p><span className="text-gray-500">Ket:</span> <span className="font-medium">{deletingTx.keterangan}</span></p>}
                                </div>
                            )}
                            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Saldo akan dihitung ulang secara otomatis.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => { setShowDeleteConfirm(false); setDeletingTx(null); }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
