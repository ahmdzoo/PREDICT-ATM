import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../Components/Modal';
import {
    Building2,
    Plus,
    Pencil,
    Trash2,
    UserPlus,
    RefreshCw,
    Loader2,
    AlertTriangle,
    CheckCircle,
    X,
    Search,
    Mail,
    Key,
    MapPin,
    Wallet,
    Smartphone,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    ArrowLeftRight,
    AlertCircle,
    Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
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

export default function Branches() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [branches, setBranches] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [expandedBranch, setExpandedBranch] = useState(null);
    const [branchSummaries, setBranchSummaries] = useState({});
    const [loadingSummary, setLoadingSummary] = useState({});

    const [showBranchModal, setShowBranchModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '' });
    const [branchErrors, setBranchErrors] = useState({});
    const [savingBranch, setSavingBranch] = useState(false);

    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminBranch, setAdminBranch] = useState(null);
    const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [adminErrors, setAdminErrors] = useState({});
    const [savingAdmin, setSavingAdmin] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingBranch, setDeletingBranch] = useState(null);

    const toggleExpandBranch = async (branchId) => {
        if (expandedBranch === branchId) {
            setExpandedBranch(null);
            return;
        }
        setExpandedBranch(branchId);

        if (!branchSummaries[branchId]) {
            setLoadingSummary((prev) => ({ ...prev, [branchId]: true }));
            try {
                const res = await api.get('/dashboard/summary', { params: { branch_id: branchId } });
                setBranchSummaries((prev) => ({ ...prev, [branchId]: res.data.data }));
            } catch {
                // silent
            } finally {
                setLoadingSummary((prev) => ({ ...prev, [branchId]: false }));
            }
        }
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [branchesRes, adminsRes] = await Promise.all([
                api.get('/branches'),
                api.get('/admins'),
            ]);
            setBranches(branchesRes.data.data || []);
            setAdmins(adminsRes.data.data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data cabang');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openCreateBranch = () => {
        setEditingBranch(null);
        setBranchForm({ name: '', code: '', address: '' });
        setBranchErrors({});
        setShowBranchModal(true);
    };

    const openEditBranch = (branch) => {
        setEditingBranch(branch);
        setBranchForm({ name: branch.name, code: branch.code, address: branch.address || '' });
        setBranchErrors({});
        setShowBranchModal(true);
    };

    const handleSaveBranch = async () => {
        const errs = {};
        if (!branchForm.name.trim()) errs.name = 'Nama cabang wajib diisi';
        if (!branchForm.code.trim()) errs.code = 'Kode cabang wajib diisi';
        setBranchErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSavingBranch(true);
        try {
            if (editingBranch) {
                await api.put(`/branches/${editingBranch.id}`, branchForm);
                toast.success('Cabang berhasil diperbarui');
            } else {
                await api.post('/branches', branchForm);
                toast.success('Cabang berhasil dibuat');
            }
            setShowBranchModal(false);
            fetchData();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                const fieldErrors = {};
                Object.keys(data.errors).forEach((key) => { fieldErrors[key] = data.errors[key][0]; });
                setBranchErrors(fieldErrors);
            } else {
                toast.error(data?.message || 'Gagal menyimpan cabang');
            }
        } finally {
            setSavingBranch(false);
        }
    };

    const openCreateAdmin = (branch) => {
        setAdminBranch(branch);
        setAdminForm({ name: '', email: '', password: '', password_confirmation: '' });
        setAdminErrors({});
        setShowAdminModal(true);
    };

    const handleCreateAdmin = async () => {
        const errs = {};
        if (!adminForm.name.trim()) errs.name = 'Nama wajib diisi';
        if (!adminForm.email.trim()) errs.email = 'Email wajib diisi';
        if (!adminForm.password || adminForm.password.length < 8) errs.password = 'Minimal 8 karakter';
        if (adminForm.password !== adminForm.password_confirmation) errs.password_confirmation = 'Konfirmasi tidak cocok';
        setAdminErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSavingAdmin(true);
        try {
            await api.post('/register-admin', {
                ...adminForm,
                branch_id: adminBranch.id,
            });
            toast.success(`Admin berhasil ditambahkan ke ${adminBranch.name}`);
            setShowAdminModal(false);
            fetchData();
        } catch (err) {
            const data = err.response?.data;
            if (data?.errors) {
                const fieldErrors = {};
                Object.keys(data.errors).forEach((key) => { fieldErrors[key] = data.errors[key][0]; });
                setAdminErrors(fieldErrors);
            } else {
                toast.error(data?.message || 'Gagal mendaftarkan admin');
            }
        } finally {
            setSavingAdmin(false);
        }
    };

    const openDeleteBranch = (branch) => {
        setDeletingBranch(branch);
        setShowDeleteConfirm(true);
    };

    const handleDeleteBranch = async () => {
        if (!deletingBranch) return;
        try {
            await api.delete(`/branches/${deletingBranch.id}`);
            toast.success('Cabang berhasil dihapus');
            setShowDeleteConfirm(false);
            setDeletingBranch(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus cabang');
        }
    };

    if (user?.role !== 'owner') {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="text-center">
                    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Hanya owner yang dapat mengakses halaman ini</p>
                </div>
            </div>
        );
    }

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

    const getAdminCount = (branchId) => admins.filter((a) => a.branch_id === branchId).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-6 h-6 text-emerald-600" />
                        Manajemen Cabang
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Kelola cabang dan admin untuk bisnis Anda
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={openCreateBranch}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Tambah Cabang
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {branches.length === 0 ? (
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Belum ada cabang</p>
                        <p className="text-sm text-gray-400 mt-1">Buat cabang pertama Anda untuk memulai</p>
                    </div>
                ) : (
                    branches.map((branch) => {
                        const isExpanded = expandedBranch === branch.id;
                        const summary = branchSummaries[branch.id];
                        const isLoadingSummary = loadingSummary[branch.id];

                        return (
                        <div key={branch.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-100 rounded-lg">
                                            <Building2 className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                                            <p className="text-xs text-gray-400 font-mono">{branch.code}</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        {getAdminCount(branch.id)} admin
                                    </span>
                                </div>
                                {branch.address && (
                                    <div className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
                                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        <span>{branch.address}</span>
                                    </div>
                                )}
                            </div>
                            <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openCreateAdmin(branch)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                    >
                                        <UserPlus className="w-3 h-3" />
                                        Tambah Admin
                                    </button>
                                    <button
                                        onClick={() => toggleExpandBranch(branch.id)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        {isExpanded ? 'Tutup Detail' : 'Detail'}
                                    </button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => openEditBranch(branch)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit cabang"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => openDeleteBranch(branch)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Hapus cabang"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Detail Ringkasan Cabang */}
                            {isExpanded && (
                                <div className="border-t border-gray-100 bg-gradient-to-br from-slate-50 to-white p-5">
                                    {isLoadingSummary ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                        </div>
                                    ) : summary ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Saldo Kas</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatRupiah(summary.saldo_kas_terkini)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Saldo Digital</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{formatRupiah(summary.saldo_digital_terkini)}</p>
                                                </div>
                                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Transaksi Hari Ini</p>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">{summary.total_transaksi_hari_ini}</p>
                                                </div>
                                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Status</p>
                                                    <p className={`text-sm font-bold mt-0.5 ${
                                                        summary.status_likuiditas === 'kritis' ? 'text-red-600' :
                                                        summary.status_likuiditas === 'warning' ? 'text-amber-600' :
                                                        'text-emerald-600'
                                                    }`}>
                                                        {summary.status_likuiditas === 'kritis' ? 'Kritis' :
                                                         summary.status_likuiditas === 'warning' ? 'Waspada' :
                                                         'Aman'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => navigate(`/transactions?branch_id=${branch.id}`)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                                >
                                                    <ArrowLeftRight className="w-3 h-3" />
                                                    Lihat Transaksi
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/prediction?branch_id=${branch.id}`)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                                >
                                                    <TrendingUp className="w-3 h-3" />
                                                    Lihat Prediksi
                                                </button>
                                            </div>

                                            <div className="border-t border-gray-200 pt-3">
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Daftar Admin</p>
                                                {admins.filter((a) => a.branch_id === branch.id).length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        {admins.filter((a) => a.branch_id === branch.id).map((admin) => (
                                                            <div key={admin.id} className="flex items-center gap-2 text-xs">
                                                                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-[9px] font-semibold text-purple-600">
                                                                    {admin.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-gray-700">{admin.name}</span>
                                                                <span className="text-gray-400">({admin.email})</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 italic">Belum ada admin</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-xs text-gray-400">
                                            Gagal memuat data
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Admin list (collapsed view) */}
                            {!isExpanded && admins.filter((a) => a.branch_id === branch.id).length > 0 && (
                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                    {admins
                                        .filter((a) => a.branch_id === branch.id)
                                        .map((admin) => (
                                            <div key={admin.id} className="px-5 py-2.5 flex items-center gap-2 text-sm">
                                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600">
                                                    {admin.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-700">{admin.name}</span>
                                                <span className="text-gray-400 text-xs">{admin.email}</span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                        );
                    })
                )}
            </div>

            {/* Modal: Create / Edit Branch */}
            <Modal
                open={showBranchModal}
                onClose={() => setShowBranchModal(false)}
                title={editingBranch ? 'Edit Cabang' : 'Tambah Cabang'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Cabang</label>
                        <input
                            type="text"
                            value={branchForm.name}
                            onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                            placeholder="Contoh: Cabang Kemanggisan"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${branchErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {branchErrors.name && <p className="text-red-500 text-xs mt-1">{branchErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kode Cabang</label>
                        <input
                            type="text"
                            value={branchForm.code}
                            onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                            placeholder="Contoh: KMG-001"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${branchErrors.code ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {branchErrors.code && <p className="text-red-500 text-xs mt-1">{branchErrors.code}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat <span className="text-gray-400 font-normal">(opsional)</span></label>
                        <textarea
                            value={branchForm.address}
                            onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                            placeholder="Alamat cabang"
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                        />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowBranchModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleSaveBranch}
                            disabled={savingBranch}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {savingBranch && <Loader2 className="w-4 h-4 animate-spin" />}
                            {editingBranch ? 'Simpan Perubahan' : 'Buat Cabang'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Create Admin */}
            <Modal
                open={showAdminModal}
                onClose={() => setShowAdminModal(false)}
                title={`Tambah Admin - ${adminBranch?.name || ''}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
                        <input
                            type="text"
                            value={adminForm.name}
                            onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                            placeholder="Nama admin"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${adminErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {adminErrors.name && <p className="text-red-500 text-xs mt-1">{adminErrors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input
                            type="email"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            placeholder="admin@email.com"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${adminErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {adminErrors.email && <p className="text-red-500 text-xs mt-1">{adminErrors.email}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <input
                            type="password"
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            placeholder="Minimal 8 karakter"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${adminErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {adminErrors.password && <p className="text-red-500 text-xs mt-1">{adminErrors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                        <input
                            type="password"
                            value={adminForm.password_confirmation}
                            onChange={(e) => setAdminForm({ ...adminForm, password_confirmation: e.target.value })}
                            placeholder="Ulangi password"
                            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${adminErrors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                        />
                        {adminErrors.password_confirmation && <p className="text-red-500 text-xs mt-1">{adminErrors.password_confirmation}</p>}
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={() => setShowAdminModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleCreateAdmin}
                            disabled={savingAdmin}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {savingAdmin && <Loader2 className="w-4 h-4 animate-spin" />}
                            Daftarkan Admin
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal: Delete confirmation */}
            <Modal
                open={showDeleteConfirm}
                onClose={() => { setShowDeleteConfirm(false); setDeletingBranch(null); }}
                title="Hapus Cabang"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-700">
                                Yakin ingin menghapus cabang <strong>{deletingBranch?.name}</strong>?
                            </p>
                            {deletingBranch && getAdminCount(deletingBranch.id) > 0 && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Cabang ini memiliki {getAdminCount(deletingBranch.id)} admin. Pindahkan admin terlebih dahulu.
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2">
                                Semua transaksi cabang ini akan kehilangan referensi cabang.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => { setShowDeleteConfirm(false); setDeletingBranch(null); }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleDeleteBranch}
                            disabled={deletingBranch && getAdminCount(deletingBranch.id) > 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            Ya, Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
