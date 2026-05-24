import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import TransactionForm from "@/Components/TransactionForm";
import TransactionList from "@/Components/TransactionList";
import PredictionChart from "@/Components/PredictionChart";
import ModalTopup from "@/Components/ModalTopup";
import {
    Wallet,
    CreditCard,
    TrendingUp,
    AlertTriangle,
    AlertCircle,
    ArrowUpDown,
    Landmark,
    Smartphone,
    BarChart3,
    Info,
    FileSpreadsheet,
    FileText,
    Upload,
    Download,
} from "lucide-react";

export default function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refresh, setRefresh] = useState(false);
    const [currentBalance, setCurrentBalance] = useState({
        kas: 0,
        digital: 0,
    });
    const [prediction, setPrediction] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState("topup");

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/transactions");
            const data = response.data.data || [];
            setTransactions(data);

            if (data.length > 0) {
                const lastTransaction = data[0];
                setCurrentBalance({
                    kas: lastTransaction.saldo_kas_setelah,
                    digital: lastTransaction.saldo_digital_setelah,
                });
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast.error("Gagal mengambil data transaksi");
        } finally {
            setLoading(false);
        }
    };

    const fetchPrediction = async () => {
        try {
            setPredictionLoading(true);
            const response = await axios.get("/api/prediction/current");
            setPrediction(response.data.data);

            const notifs = [];
            const data = response.data.data;

            if (data && data.rekomendasi_kas > 0) {
                notifs.push({
                    type: "warning",
                    message: `Kas diperkirakan menipis! Siapkan tambahan kas: Rp ${data.rekomendasi_kas.toLocaleString("id-ID")}`,
                });
            }
            if (data && data.rekomendasi_digital > 0) {
                notifs.push({
                    type: "warning",
                    message: `Saldo digital diperkirakan menipis! Siapkan tambahan saldo: Rp ${data.rekomendasi_digital.toLocaleString("id-ID")}`,
                });
            }
            if (currentBalance.kas < 2000000 && currentBalance.kas > 0) {
                notifs.push({
                    type: "danger",
                    message: `DARURAT! Saldo kas tersisa Rp ${currentBalance.kas.toLocaleString("id-ID")} (di bawah Rp 2.000.000)`,
                });
            }
            if (
                currentBalance.digital < 1000000 &&
                currentBalance.digital > 0
            ) {
                notifs.push({
                    type: "danger",
                    message: `DARURAT! Saldo digital tersisa Rp ${currentBalance.digital.toLocaleString("id-ID")} (di bawah Rp 1.000.000)`,
                });
            }

            setNotifications(notifs);
        } catch (error) {
            console.error("Error fetching prediction:", error);
        } finally {
            setPredictionLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        if (currentBalance.kas > 0 || currentBalance.digital > 0) {
            fetchPrediction();
        }
    }, [currentBalance]);

    useEffect(() => {
        if (refresh) {
            fetchTransactions();
            setRefresh(false);
        }
    }, [refresh]);

    const handleTransactionSuccess = () => {
        setRefresh(true);
    };

    const handleTopup = () => {
        setModalType("topup");
        setModalOpen(true);
    };

    const handleRestock = () => {
        setModalType("restock");
        setModalOpen(true);
    };

    const handleExportExcel = async () => {
        toast.loading("Menyiapkan file Excel...", { id: "export" });
        try {
            window.open("/export/excel", "_blank");
            toast.success("File Excel siap didownload!", { id: "export" });
        } catch {
            toast.error("Gagal export Excel", { id: "export" });
        }
    };

    const handleExportPdf = async () => {
        toast.loading("Menyiapkan file PDF...", { id: "export" });
        try {
            window.open("/export/pdf", "_blank");
            toast.success("File PDF siap didownload!", { id: "export" });
        } catch {
            toast.error("Gagal export PDF", { id: "export" });
        }
    };

    const formatRupiah = (angka) => {
        if (!angka && angka !== 0) return "Rp 0";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(angka);
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-12">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {/* Toast Container */}
                <Toaster
                    position="top-right"
                    reverseOrder={false}
                    toastOptions={{
                        duration: 3000,
                        style: {
                            background: "#363636",
                            color: "#fff",
                            borderRadius: "12px",
                            padding: "12px 16px",
                        },
                        success: {
                            style: {
                                background: "#10b981",
                                color: "#fff",
                            },
                            iconTheme: {
                                primary: "#fff",
                                secondary: "#10b981",
                            },
                        },
                        error: {
                            style: {
                                background: "#ef4444",
                                color: "#fff",
                            },
                        },
                        loading: {
                            style: {
                                background: "#3b82f6",
                                color: "#fff",
                            },
                        },
                    }}
                />

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Landmark className="w-8 h-8 text-indigo-600" />
                        Dashboard Mini ATM - BRI Link
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Kelola transaksi dan pantau likuiditas kas
                    </p>
                </div>

                {/* Notifikasi Sistem (bawaan) */}
                {notifications.length > 0 && (
                    <div className="mb-6 space-y-2">
                        {notifications.map((notif, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg flex items-center gap-3 ${
                                    notif.type === "danger"
                                        ? "bg-red-100 border border-red-400 text-red-700"
                                        : "bg-yellow-100 border border-yellow-400 text-yellow-700"
                                }`}
                            >
                                {notif.type === "danger" ? (
                                    <AlertCircle className="w-5 h-5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5" />
                                )}
                                {notif.message}
                            </div>
                        ))}
                    </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={handleExportExcel}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export Excel
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <FileText className="w-4 h-4" />
                        Export PDF
                    </button>
                    <button
                        onClick={handleTopup}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <Upload className="w-4 h-4" />
                        Topup Digital
                    </button>
                    <button
                        onClick={handleRestock}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Restock Kas
                    </button>
                </div>

                {/* Kartu Saldo - Sama seperti sebelumnya */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div
                        className={`rounded-xl shadow-lg p-6 text-white transition-all ${
                            currentBalance.kas < 2000000
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-green-500 to-green-600"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm flex items-center gap-1">
                                    <Wallet className="w-4 h-4" />
                                    Saldo Kas (Fisik)
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatRupiah(currentBalance.kas)}
                                </p>
                                <p className="text-white/80 text-xs mt-2">
                                    Uang tunai di tangan
                                </p>
                            </div>
                            <div className="text-5xl opacity-80">
                                <Wallet className="w-12 h-12" />
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-xl shadow-lg p-6 text-white transition-all ${
                            currentBalance.digital < 1000000
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-blue-500 to-blue-600"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/80 text-sm flex items-center gap-1">
                                    <Smartphone className="w-4 h-4" />
                                    Saldo Digital (BRI Link)
                                </p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatRupiah(currentBalance.digital)}
                                </p>
                                <p className="text-white/80 text-xs mt-2">
                                    Saldo di aplikasi BRI Link
                                </p>
                            </div>
                            <div className="text-5xl opacity-80">
                                <CreditCard className="w-12 h-12" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* KARTU PREDIKSI */}
                {!predictionLoading && prediction && (
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            PREDIKSI KEBUTUHAN BESOK (Single Exponential
                            Smoothing)
                        </h3>

                        {prediction.prediksi_kas !== undefined &&
                        prediction.prediksi_kas !== null ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/10 rounded-lg p-4">
                                    <p className="text-purple-200 text-sm flex items-center gap-1">
                                        <Wallet className="w-4 h-4" />
                                        Tarik Tunai (Kas Fisik)
                                    </p>
                                    <p className="text-3xl font-bold mt-1">
                                        {formatRupiah(prediction.prediksi_kas)}
                                    </p>
                                    <p className="text-purple-200 text-xs mt-2">
                                        Alpha: {prediction.alpha_kas} | MAPE:{" "}
                                        {prediction.mape_kas}%
                                    </p>
                                    {prediction.rekomendasi_kas > 0 && (
                                        <div className="mt-3 bg-yellow-500/30 rounded p-2">
                                            <p className="text-yellow-200 text-sm font-semibold flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                REKOMENDASI
                                            </p>
                                            <p className="text-white text-sm">
                                                Siapkan tambahan kas:{" "}
                                                {formatRupiah(
                                                    prediction.rekomendasi_kas,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white/10 rounded-lg p-4">
                                    <p className="text-purple-200 text-sm flex items-center gap-1">
                                        <ArrowUpDown className="w-4 h-4" />
                                        Transfer (Saldo Digital)
                                    </p>
                                    <p className="text-3xl font-bold mt-1">
                                        {formatRupiah(
                                            prediction.prediksi_digital,
                                        )}
                                    </p>
                                    <p className="text-purple-200 text-xs mt-2">
                                        Alpha: {prediction.alpha_digital} |
                                        MAPE: {prediction.mape_digital}%
                                    </p>
                                    {prediction.rekomendasi_digital > 0 && (
                                        <div className="mt-3 bg-yellow-500/30 rounded p-2">
                                            <p className="text-yellow-200 text-sm font-semibold flex items-center gap-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                REKOMENDASI
                                            </p>
                                            <p className="text-white text-sm">
                                                Siapkan tambahan saldo digital:{" "}
                                                {formatRupiah(
                                                    prediction.rekomendasi_digital,
                                                )}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-yellow-200 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                {prediction.message ||
                                    "Memuat data prediksi..."}
                            </p>
                        )}

                        <div className="mt-4 pt-3 border-t border-white/20 text-xs text-purple-200 flex items-center gap-2">
                            <BarChart3 className="w-3 h-3" />
                            Metode: Single Exponential Smoothing | Buffer: 20% |
                            MAPE &lt; 20% = Sangat Akurat | 20-50% = Cukup
                            Akurat
                        </div>
                    </div>
                )}

                {/* Grafik */}
                <div className="mb-8">
                    <PredictionChart />
                </div>

                {/* Form dan List Transaksi */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <TransactionForm onSuccess={handleTransactionSuccess} />
                    <TransactionList transactions={transactions} />
                </div>
            </div>

            {/* MODAL TOPUP/RESTOCK */}
            {modalOpen && (
                <ModalTopup
                    type={modalType}
                    onClose={() => setModalOpen(false)}
                    onSuccess={() => {
                        toast.success(
                            modalType === "topup"
                                ? "Topup berhasil!"
                                : "Restock berhasil!",
                        );
                        setRefresh(true);
                    }}
                    currentBalance={currentBalance}
                />
            )}
        </div>
    );
}
