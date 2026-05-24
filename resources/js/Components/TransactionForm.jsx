import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Wallet,
    Upload,
    Download,
    ArrowUpDown,
    Smartphone,
    AlertCircle,
} from "lucide-react";

export default function TransactionForm({ onSuccess }) {
    const [form, setForm] = useState({
        jenis: "tarik_tunai",
        nominal: "",
        keterangan: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const jenisTransaksi = [
        {
            value: "tarik_tunai",
            label: "Tarik Tunai",
            icon: <Wallet className="w-4 h-4" />,
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
        },
        {
            value: "setor_tunai",
            label: "Setor Tunai",
            icon: <Upload className="w-4 h-4" />,
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-200",
        },
        {
            value: "transfer",
            label: "Transfer",
            icon: <ArrowUpDown className="w-4 h-4" />,
            color: "text-purple-600",
            bg: "bg-purple-50 border-purple-200",
        },
        {
            value: "ppob",
            label: "PPOB",
            icon: <Smartphone className="w-4 h-4" />,
            color: "text-orange-600",
            bg: "bg-orange-50 border-orange-200",
        },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.nominal || form.nominal < 1000) {
            toast.error("Nominal minimal Rp 1.000");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("/api/transactions", {
                jenis: form.jenis,
                nominal: form.nominal,
                keterangan: form.keterangan,
            });

            if (response.data.success) {
                // Reset form
                setForm({
                    jenis: "tarik_tunai",
                    nominal: "",
                    keterangan: "",
                });

                // HANYA 1 TOAST DARI SINI
                toast.success("Transaksi berhasil disimpan!");

                // Panggil onSuccess untuk refresh data
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Terjadi kesalahan";
            toast.error(errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const selectedJenis =
        jenisTransaksi.find((j) => j.value === form.jenis) || jenisTransaksi[0];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                    Catat Transaksi Baru
                </h2>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Transaksi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {jenisTransaksi.map((item) => (
                            <button
                                key={item.value}
                                type="button"
                                onClick={() =>
                                    setForm({ ...form, jenis: item.value })
                                }
                                className={`p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                                    form.jenis === item.value
                                        ? `${item.bg} border-indigo-500 shadow-sm`
                                        : "border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50"
                                }`}
                            >
                                <span
                                    className={
                                        form.jenis === item.value
                                            ? item.color
                                            : "text-gray-500"
                                    }
                                >
                                    {item.icon}
                                </span>
                                <span
                                    className={`text-sm font-medium ${form.jenis === item.value ? item.color : "text-gray-600"}`}
                                >
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nominal (Rp)
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            Rp
                        </div>
                        <input
                            type="number"
                            value={form.nominal}
                            onChange={(e) =>
                                setForm({ ...form, nominal: e.target.value })
                            }
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="0"
                            required
                            min="1000"
                            step="1000"
                        />
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        {[50000, 100000, 250000, 500000].map((nom) => (
                            <button
                                key={nom}
                                type="button"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        nominal: nom.toString(),
                                    })
                                }
                                className="py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all text-gray-600"
                            >
                                Rp {nom.toLocaleString("id-ID")}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Keterangan (Opsional)
                    </label>
                    <input
                        type="text"
                        value={form.keterangan}
                        onChange={(e) =>
                            setForm({ ...form, keterangan: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        placeholder="Contoh: Nasabah Ani, Bayar listrik, dll"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Wallet className="w-4 h-4" />
                            Simpan Transaksi
                        </>
                    )}
                </button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 text-center">
                💡 Setiap transaksi akan langsung mempengaruhi saldo kas/digital
            </div>
        </div>
    );
}
