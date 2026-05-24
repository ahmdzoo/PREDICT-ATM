import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { X, Upload, Download, DollarSign, AlertCircle } from "lucide-react";

export default function ModalTopup({
    type,
    onClose,
    onSuccess,
    currentBalance,
}) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const isTopup = type === "topup";
    const title = isTopup ? "Topup Saldo Digital" : "Restock Kas Fisik";
    const description = isTopup
        ? "Tambahkan saldo digital dari rekening bank Anda."
        : "Tambahkan uang tunai ke kas fisik dari bank.";
    const minAmount = isTopup ? 50000 : 100000;
    const icon = isTopup ? (
        <Upload className="w-6 h-6" />
    ) : (
        <Download className="w-6 h-6" />
    );
    const buttonColor = isTopup
        ? "bg-green-600 hover:bg-green-700"
        : "bg-blue-600 hover:bg-blue-700";
    const currentSaldo = isTopup
        ? currentBalance?.digital
        : currentBalance?.kas;

    const formatRupiah = (angka) => {
        if (!angka && angka !== 0) return "Rp 0";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(angka);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const nominal = parseInt(amount);
        if (isNaN(nominal) || nominal < minAmount) {
            setError(
                `Minimal ${isTopup ? "topup" : "restock"} Rp ${minAmount.toLocaleString("id-ID")}`,
            );
            return;
        }

        setLoading(true);
        const url = isTopup ? "/api/topup-digital" : "/api/restock-kas";

        try {
            const response = await axios.post(url, { amount: nominal });

            if (response.data.success) {
                toast.success(response.data.message, {
                    duration: 4000,
                    position: "top-right",
                    icon: isTopup ? "💰" : "💵",
                    style: {
                        background: "#10b981",
                        color: "#fff",
                        borderRadius: "12px",
                        padding: "12px 16px",
                    },
                });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error(response.data.message || "Terjadi kesalahan", {
                    duration: 4000,
                    position: "top-right",
                    style: {
                        background: "#ef4444",
                        color: "#fff",
                        borderRadius: "12px",
                        padding: "12px 16px",
                    },
                });
                setError(response.data.message || "Terjadi kesalahan");
            }
        } catch (err) {
            console.error(err);
            const errorMsg =
                err.response?.data?.message || "Terjadi kesalahan pada server";
            toast.error(errorMsg, {
                duration: 4000,
                position: "top-right",
                style: {
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: "12px",
                    padding: "12px 16px",
                },
            });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded-lg ${isTopup ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                        >
                            {icon}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5">
                    <p className="text-gray-600 text-sm mb-4">{description}</p>

                    {/* Saldo saat ini */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Saldo Saat Ini
                        </p>
                        <p className="text-2xl font-bold text-gray-800">
                            {formatRupiah(currentSaldo)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {isTopup
                                ? "Saldo Digital BRI Link"
                                : "Uang Tunai di Tangan"}
                        </p>
                    </div>

                    {/* Input nominal */}
                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nominal Topup
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                placeholder={`Minimal Rp ${minAmount.toLocaleString("id-ID")}`}
                                min={minAmount}
                                step="10000"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-between mt-2">
                            <p className="text-xs text-gray-500">
                                Minimal: Rp {minAmount.toLocaleString("id-ID")}
                            </p>
                            <p className="text-xs text-gray-400">
                                Kelipatan Rp 10.000
                            </p>
                        </div>
                    </div>

                    {/* Quick nominal buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {[100000, 250000, 500000, 750000, 1000000].map(
                            (nom) => (
                                <button
                                    key={nom}
                                    type="button"
                                    onClick={() => setAmount(nom.toString())}
                                    className="py-2 text-sm border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all text-gray-600"
                                >
                                    Rp {nom.toLocaleString("id-ID")}
                                </button>
                            ),
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2 animate-in fade-in duration-150">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 ${buttonColor} text-white py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    {icon}
                                    {isTopup
                                        ? "Topup Sekarang"
                                        : "Restock Sekarang"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
