<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\SESService;
use Illuminate\Http\Request;

class PredictionController extends Controller
{
    public function getCurrentPrediction()
    {
        // Ambil 30 hari terakhir
        $transactions = Transaction::where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'asc')
            ->get();

        if ($transactions->count() < 7) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Minimal 7 hari data transaksi untuk prediksi. Saat ini: ' . $transactions->count() . ' transaksi'
                ]
            ]);
        }

        // Siapkan data historis untuk tarik tunai
        $historicalKas = [];
        foreach ($transactions as $t) {
            if ($t->jenis === 'tarik_tunai') {
                $historicalKas[] = (float) $t->nominal;
            }
        }

        // Siapkan data historis untuk transfer
        $historicalDigital = [];
        foreach ($transactions as $t) {
            if ($t->jenis === 'transfer') {
                $historicalDigital[] = (float) $t->nominal;
            }
        }

        // Cek apakah data cukup
        if (count($historicalKas) < 3) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Data tarik tunai belum cukup untuk prediksi. Butuh minimal 3 transaksi. Saat ini: ' . count($historicalKas)
                ]
            ]);
        }

        // Cari alpha optimal
        $optimalKas = SESService::findOptimalAlpha($historicalKas);
        $optimalDigital = (count($historicalDigital) >= 3) ? SESService::findOptimalAlpha($historicalDigital) : ['alpha' => 0.5, 'mape' => 0];

        // Hitung prediksi
        $prediksiKas = SESService::forecast($historicalKas, $optimalKas['alpha']);
        $prediksiDigital = (count($historicalDigital) >= 3) ? SESService::forecast($historicalDigital, $optimalDigital['alpha']) : 0;

        // Ambil saldo terakhir
        $lastTransaction = Transaction::latest()->first();
        $saldoKasSekarang = $lastTransaction ? (float) $lastTransaction->saldo_kas_setelah : 5000000;
        $saldoDigitalSekarang = $lastTransaction ? (float) $lastTransaction->saldo_digital_setelah : 3000000;

        // Hitung rekomendasi dengan buffer 20%
        $bufferPersen = 20;
        $rekomendasiKas = max(0, ($prediksiKas * (100 + $bufferPersen) / 100) - $saldoKasSekarang);
        $rekomendasiDigital = max(0, ($prediksiDigital * (100 + $bufferPersen) / 100) - $saldoDigitalSekarang);

        return response()->json([
            'success' => true,
            'data' => [
                'prediksi_kas' => round($prediksiKas, 0),
                'prediksi_digital' => round($prediksiDigital, 0),
                'alpha_kas' => $optimalKas['alpha'],
                'alpha_digital' => $optimalDigital['alpha'],
                'mape_kas' => $optimalKas['mape'],
                'mape_digital' => $optimalDigital['mape'],
                'saldo_kas_sekarang' => $saldoKasSekarang,
                'saldo_digital_sekarang' => $saldoDigitalSekarang,
                'rekomendasi_kas' => round($rekomendasiKas, 0),
                'rekomendasi_digital' => round($rekomendasiDigital, 0),
                'jumlah_data_kas' => count($historicalKas),
                'jumlah_data_digital' => count($historicalDigital),
            ]
        ]);
    }

    public function getChartData()
    {
        $transactions = Transaction::where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'asc')
            ->get();

        // Ambil data tarik tunai
        $historicalKas = [];
        $dates = [];
        foreach ($transactions as $t) {
            if ($t->jenis === 'tarik_tunai') {
                $historicalKas[] = (float) $t->nominal;
                $dates[] = $t->created_at->format('d M');
            }
        }

        if (count($historicalKas) < 3) {
            return response()->json([
                'success' => true,
                'data' => [
                    'actuals' => [],
                    'forecasts' => [],
                    'labels' => []
                ]
            ]);
        }

        $optimal = SESService::findOptimalAlpha($historicalKas);

        // Generate forecast untuk setiap titik
        $forecasts = [];
        $forecast = $historicalKas[0];

        for ($i = 0; $i < count($historicalKas); $i++) {
            $forecasts[] = round($forecast, 0);
            if ($i < count($historicalKas) - 1) {
                $forecast = ($optimal['alpha'] * $historicalKas[$i]) + ((1 - $optimal['alpha']) * $forecast);
            }
        }

        // Tambahkan prediksi untuk besok
        $nextForecast = SESService::forecast($historicalKas, $optimal['alpha']);
        $forecasts[] = round($nextForecast, 0);

        $labels = array_merge($dates, ['Besok']);

        return response()->json([
            'success' => true,
            'data' => [
                'actuals' => $historicalKas,
                'forecasts' => $forecasts,
                'labels' => $labels
            ]
        ]);
    }
}