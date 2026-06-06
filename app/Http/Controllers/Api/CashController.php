<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\BranchScope;
use App\Models\Balance;
use App\Models\Branch;
use App\Models\MasterBank;
use App\Models\Transaction;
use Illuminate\Http\Request;

class CashController extends Controller
{
    use BranchScope;

    public function topupDigital(Request $request)
    {
        try {
            $amount = $request->amount;
            $bankId = $request->bank_id;

            if (!$amount || $amount < 50000) {
                return response()->json([
                    'success' => false,
                    'message' => 'Minimal topup Rp 50.000'
                ]);
            }

            $bank = MasterBank::find($bankId);
            if (!$bank || !in_array($bank->tipe, ['bank', 'e-wallet'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sumber dana tidak valid'
                ]);
            }

            $user = $request->user();
            $requestBranchId = $request->branch_id;
            $branchId = $user->branch_id;

            if ($user->isOwner()) {
                if ($requestBranchId) {
                    $branch = Branch::where('owner_id', $user->id)->find($requestBranchId);
                    if (!$branch) {
                        return response()->json(['success' => false, 'message' => 'Cabang tidak ditemukan'], 404);
                    }
                    $branchId = $branch->id;
                } else {
                    return response()->json(['success' => false, 'message' => 'Owner harus memilih cabang'], 422);
                }
            }

            Transaction::create([
                'jenis' => 'topup_digital',
                'source' => $bank->kode,
                'bank_id' => $bank->id,
                'nominal' => $amount,
                'biaya_admin' => 0,
                'saldo_kas_setelah' => 0,
                'saldo_digital_setelah' => 0,
                'keterangan' => 'Topup ' . $bank->nama . ' dari bank',
                'branch_id' => $branchId,
            ]);

            Balance::updateBalance($branchId, $bank->kode, $amount, $bank->id);

            $balance = Balance::where('branch_id', $branchId)->where('bank_id', $bank->id)->first();
            $saldo = $balance ? (float) $balance->saldo : 0;

            return response()->json([
                'success' => true,
                'message' => 'Topup ' . $bank->nama . ' berhasil! Saldo: Rp ' . number_format($saldo, 0, ',', '.')
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

            $user = $request->user();
            $requestBranchId = $request->branch_id;
            $branchId = $user->branch_id;

            if ($user->isOwner()) {
                if ($requestBranchId) {
                    $branch = Branch::where('owner_id', $user->id)->find($requestBranchId);
                    if (!$branch) {
                        return response()->json(['success' => false, 'message' => 'Cabang tidak ditemukan'], 404);
                    }
                    $branchId = $branch->id;
                } else {
                    return response()->json(['success' => false, 'message' => 'Owner harus memilih cabang'], 422);
                }
            }

            $laci = MasterBank::where('kode', 'laci')->first();

            Transaction::create([
                'jenis' => 'restock_kas',
                'source' => 'laci',
                'bank_id' => $laci?->id,
                'nominal' => $amount,
                'biaya_admin' => 0,
                'saldo_kas_setelah' => 0,
                'saldo_digital_setelah' => 0,
                'keterangan' => 'Restock kas dari bank',
                'branch_id' => $branchId,
            ]);

            Balance::updateBalance($branchId, 'laci', $amount, $laci?->id);

            $balance = Balance::where('branch_id', $branchId)->where('bank_id', $laci?->id)->first();
            $saldo = $balance ? (float) $balance->saldo : 0;

            return response()->json([
                'success' => true,
                'message' => 'Restock berhasil! Saldo laci: Rp ' . number_format($saldo, 0, ',', '.')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
}
