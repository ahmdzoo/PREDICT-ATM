<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index()
    {
        $transactions = Transaction::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function store(Request $request)
    {
        // Validasi input
        $validated = $request->validate([
            'jenis' => 'required|in:tarik_tunai,setor_tunai,transfer,ppob',
            'nominal' => 'required|numeric|min:1000',
            'keterangan' => 'nullable|string'
        ]);

        // Ambil transaksi terakhir untuk saldo terbaru
        $lastTransaction = Transaction::latest()->first();
        
        // Set default saldo awal jika belum ada transaksi
        if (!$lastTransaction) {
            $currentSaldoKas = 5000000; // Rp 5.000.000 default
            $currentSaldoDigital = 3000000; // Rp 3.000.000 default
        } else {
            $currentSaldoKas = $lastTransaction->saldo_kas_setelah;
            $currentSaldoDigital = $lastTransaction->saldo_digital_setelah;
        }

        // Hitung saldo baru berdasarkan jenis transaksi
        $jenis = $request->jenis;
        $nominal = $request->nominal;

        switch ($jenis) {
            case 'tarik_tunai':
                // Nasabah tarik uang tunai dari kas agen
                $newSaldoKas = $currentSaldoKas - $nominal;
                $newSaldoDigital = $currentSaldoDigital;
                break;
                
            case 'setor_tunai':
                // Nasabah setor uang tunai ke kas agen
                $newSaldoKas = $currentSaldoKas + $nominal;
                $newSaldoDigital = $currentSaldoDigital;
                break;
                
            case 'transfer':
                // Transfer dari saldo digital agen
                $newSaldoKas = $currentSaldoKas;
                $newSaldoDigital = $currentSaldoDigital - $nominal;
                break;
                
            case 'ppob':
                // Pembayaran tagihan dari saldo digital
                $newSaldoKas = $currentSaldoKas;
                $newSaldoDigital = $currentSaldoDigital - $nominal;
                break;
                
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Jenis transaksi tidak valid'
                ], 422);
        }

        // Cek apakah saldo mencukupi
        if ($newSaldoKas < 0 || $newSaldoDigital < 0) {
            return response()->json([
                'success' => false,
                'message' => 'Saldo tidak mencukupi untuk transaksi ini'
            ], 400);
        }

        // Simpan transaksi
        $transaction = Transaction::create([
            'jenis' => $jenis,
            'nominal' => $nominal,
            'saldo_kas_setelah' => $newSaldoKas,
            'saldo_digital_setelah' => $newSaldoDigital,
            'keterangan' => $request->keterangan,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil disimpan',
            'data' => $transaction
        ]);
    }
}