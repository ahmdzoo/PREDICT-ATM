<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class CashController extends Controller
{
    public function topupDigital(Request $request)
    {
        try {
            $amount = $request->amount;
            
            if (!$amount || $amount < 50000) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Minimal topup Rp 50.000'
                ]);
            }

            $lastTransaction = Transaction::latest()->first();
            
            $currentDigital = $lastTransaction ? (float) $lastTransaction->saldo_digital_setelah : 3000000;
            $currentKas = $lastTransaction ? (float) $lastTransaction->saldo_kas_setelah : 5000000;
            
            $newDigital = $currentDigital + (float) $amount;
            
            Transaction::create([
                'jenis' => 'topup_digital',
                'nominal' => $amount,
                'saldo_kas_setelah' => $currentKas,
                'saldo_digital_setelah' => $newDigital,
                'keterangan' => 'Topup saldo digital dari bank',
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Topup berhasil! Saldo digital sekarang: Rp ' . number_format($newDigital, 0, ',', '.')
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
    
    public function restockKas(Request $request)
    {
        try {
            $amount = $request->amount;
            
            if (!$amount || $amount < 100000) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Minimal restock Rp 100.000'
                ]);
            }

            $lastTransaction = Transaction::latest()->first();
            
            $currentKas = $lastTransaction ? (float) $lastTransaction->saldo_kas_setelah : 5000000;
            $currentDigital = $lastTransaction ? (float) $lastTransaction->saldo_digital_setelah : 3000000;
            
            $newKas = $currentKas + (float) $amount;
            
            Transaction::create([
                'jenis' => 'restock_kas',
                'nominal' => $amount,
                'saldo_kas_setelah' => $newKas,
                'saldo_digital_setelah' => $currentDigital,
                'keterangan' => 'Restock kas dari bank',
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Restock berhasil! Saldo kas sekarang: Rp ' . number_format($newKas, 0, ',', '.')
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
}