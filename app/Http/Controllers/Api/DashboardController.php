<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary()
    {
        // Get last transaction for current balance
        $lastTransaction = Transaction::latest()->first();

        // Count today's transactions
        $todayTransactions = Transaction::whereDate('created_at', today())->count();

        // Determine liquidity status
        $saldoKas = $lastTransaction ? $lastTransaction->saldo_kas_setelah : 5000000;
        $saldoDigital = $lastTransaction ? $lastTransaction->saldo_digital_setelah : 3000000;

        if ($saldoKas < 2000000 || $saldoDigital < 1000000) {
            $status = 'kritis';
        } elseif ($saldoKas < 4000000 || $saldoDigital < 2000000) {
            $status = 'warning';
        } else {
            $status = 'aman';
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_transaksi_hari_ini' => $todayTransactions,
                'saldo_kas_terkini' => $saldoKas,
                'saldo_digital_terkini' => $saldoDigital,
                'status_likuiditas' => $status,
                'prediksi_kas_besok' => null, // Will be filled by prediction controller
                'prediksi_digital_besok' => null,
            ]
        ]);
    }

    public function last30Days()
    {
        $transactions = Transaction::where('created_at', '>=', now()->subDays(30))
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy(function ($date) {
                return $date->created_at->format('Y-m-d');
            })
            ->map(function ($day) {
                return [
                    'tanggal' => $day->first()->created_at->format('Y-m-d'),
                    'total_tarik' => $day->where('jenis', 'tarik_tunai')->sum('nominal'),
                    'total_setor' => $day->where('jenis', 'setor_tunai')->sum('nominal'),
                    'total_transfer' => $day->where('jenis', 'transfer')->sum('nominal'),
                    'jumlah_transaksi' => $day->count(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }
}