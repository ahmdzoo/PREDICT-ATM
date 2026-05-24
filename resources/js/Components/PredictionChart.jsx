import { useEffect, useState } from "react";
import axios from "axios";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
);

export default function PredictionChart() {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        try {
            const response = await axios.get("/api/prediction/chart");
            const data = response.data.data;

            setChartData({
                labels: data.labels,
                datasets: [
                    {
                        label: "Aktual (Data Historis)",
                        data: data.actuals,
                        borderColor: "rgb(59, 130, 246)",
                        backgroundColor: "rgba(59, 130, 246, 0.5)",
                        tension: 0.3,
                        fill: false,
                    },
                    {
                        label: "Prediksi (SES)",
                        data: data.forecasts,
                        borderColor: "rgb(168, 85, 247)",
                        backgroundColor: "rgba(168, 85, 247, 0.5)",
                        borderDash: [5, 5],
                        tension: 0.3,
                        fill: false,
                    },
                ],
            });
        } catch (error) {
            console.error("Error fetching chart data:", error);
        } finally {
            setLoading(false);
        }
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "Grafik Perbandingan Aktual vs Prediksi (Tarik Tunai)",
                font: {
                    size: 16,
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || "";
                        if (label) {
                            label += ": ";
                        }
                        label +=
                            "Rp " +
                            new Intl.NumberFormat("id-ID").format(context.raw);
                        return label;
                    },
                },
            },
        },
        scales: {
            y: {
                ticks: {
                    callback: function (value) {
                        return (
                            "Rp " + new Intl.NumberFormat("id-ID").format(value)
                        );
                    },
                },
            },
        },
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Memuat grafik...</span>
                </div>
            </div>
        );
    }

    if (!chartData) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="h-80 flex items-center justify-center text-gray-500">
                    Data belum cukup untuk menampilkan grafik (minimal 7
                    transaksi)
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="h-96">
                <Line data={chartData} options={options} />
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
                📊 Metode: Single Exponential Smoothing | Garis putus-putus =
                Prediksi
            </p>
        </div>
    );
}
