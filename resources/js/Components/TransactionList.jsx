import { useState } from "react";

export default function TransactionList({ transactions }) {
    const [filter, setFilter] = useState("semua");

    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    📋 Riwayat Transaksi
                </h2>
                <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">📭</p>
                    <p>Belum ada transaksi</p>
                    <p className="text-sm mt-1">
                        Silakan catat transaksi baru di form sebelah kiri
                    </p>
                </div>
            </div>
        );
    }

    const getJenisIcon = (jenis) => {
        switch (jenis) {
            case "tarik_tunai":
                return "💵";
            case "setor_tunai":
                return "💰";
            case "transfer":
                return "💸";
            case "ppob":
                return "📱";
            default:
                return "📝";
        }
    };

    const getJenisColor = (jenis) => {
        switch (jenis) {
            case "tarik_tunai":
                return "border-l-red-500 bg-red-50";
            case "setor_tunai":
                return "border-l-green-500 bg-green-50";
            case "transfer":
                return "border-l-blue-500 bg-blue-50";
            case "ppob":
                return "border-l-orange-500 bg-orange-50";
            default:
                return "border-l-gray-500 bg-gray-50";
        }
    };

    const filteredTransactions = transactions.filter((trans) => {
        if (filter === "semua") return true;
        return trans.jenis === filter;
    });

    const formatRupiah = (angka) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(angka);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h2 className="text-xl font-bold text-gray-800">
                    📋 Riwayat Transaksi
                </h2>

                <div className="flex gap-2">
                    {[
                        "semua",
                        "tarik_tunai",
                        "setor_tunai",
                        "transfer",
                        "ppob",
                    ].map((jenis) => (
                        <button
                            key={jenis}
                            onClick={() => setFilter(jenis)}
                            className={`px-3 py-1 text-sm rounded-full transition-all ${
                                filter === jenis
                                    ? "bg-indigo-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {jenis === "semua"
                                ? "Semua"
                                : jenis === "tarik_tunai"
                                  ? "Tarik"
                                  : jenis === "setor_tunai"
                                    ? "Setor"
                                    : jenis === "transfer"
                                      ? "Transfer"
                                      : "PPOB"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-4xl mb-2">🔍</p>
                        <p>Tidak ada transaksi untuk filter ini</p>
                    </div>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className={`border-l-4 p-4 rounded-lg transition-all hover:shadow-md ${getJenisColor(transaction.jenis)}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {getJenisIcon(transaction.jenis)}
                                    </span>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {transaction.jenis === "tarik_tunai"
                                                ? "Tarik Tunai"
                                                : transaction.jenis ===
                                                    "setor_tunai"
                                                  ? "Setor Tunai"
                                                  : transaction.jenis ===
                                                      "transfer"
                                                    ? "Transfer"
                                                    : "PPOB"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(transaction.created_at)}
                                        </p>
                                        {transaction.keterangan && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                📌 {transaction.keterangan}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={`font-bold ${
                                            transaction.jenis === "tarik_tunai"
                                                ? "text-red-600"
                                                : transaction.jenis ===
                                                    "setor_tunai"
                                                  ? "text-green-600"
                                                  : "text-blue-600"
                                        }`}
                                    >
                                        {transaction.jenis === "tarik_tunai"
                                            ? "- "
                                            : transaction.jenis ===
                                                "setor_tunai"
                                              ? "+ "
                                              : "- "}
                                        {formatRupiah(transaction.nominal)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        💵 Kas:{" "}
                                        {formatRupiah(
                                            transaction.saldo_kas_setelah,
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        📱 Digital:{" "}
                                        {formatRupiah(
                                            transaction.saldo_digital_setelah,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-3 border-t text-center text-sm text-gray-500">
                Total {filteredTransactions.length} dari {transactions.length}{" "}
                transaksi
            </div>
        </div>
    );
}
