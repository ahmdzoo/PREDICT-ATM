<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\BranchScope;
use App\Models\Balance;
use App\Models\Branch;
use App\Models\MasterBank;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    use BranchScope;

    public function index(Request $request)
    {
        $query = Transaction::orderBy('created_at', 'desc');
        $query = $this->applyBranchScope($query, $request);
        $transactions = $query->get();

        return response()->json([
            'success' => true,
            'data' => $transactions
        ]);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();
        $transaction = Transaction::findOrFail($id);
        $branchId = $this->getBranchId($request);

        if ($branchId) {
            if ($transaction->branch_id != $branchId) {
                return response()->json(['success' => false, 'message' => 'Not found'], 404);
            }
        } elseif ($user->isOwner()) {
            $branchIds = Branch::where('owner_id', $user->id)->pluck('id');
            if (!in_array($transaction->branch_id, $branchIds->toArray())) {
                return response()->json(['success' => false, 'message' => 'Not found'], 404);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $transaction
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'jenis' => 'required|in:tarik_tunai,transfer,ppob,topup_digital,restock_kas',
            'bank_id' => 'required|exists:master_banks,id',
            'nominal' => [
                'required',
                'numeric',
                'min:1000',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->jenis === 'topup_digital' && $value < 50000) {
                        $fail('Minimal topup digital Rp 50.000');
                    }
                    if ($request->jenis === 'restock_kas' && $value < 100000) {
                        $fail('Minimal restock kas Rp 100.000');
                    }
                },
            ],
            'biaya_admin' => 'nullable|numeric|min:0',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $bank = MasterBank::findOrFail($validated['bank_id']);

        $allowedTypes = in_array($validated['jenis'], ['restock_kas'])
            ? ['kas']
            : ['bank', 'e-wallet'];

        if (!in_array($bank->tipe, $allowedTypes)) {
            return response()->json([
                'success' => false,
                'message' => $bank->nama . ' (' . $bank->tipe . ') tidak valid untuk ' . $validated['jenis']
            ], 422);
        }

        $branchId = $user->branch_id;

        if ($user->isOwner()) {
            $requestBranchId = $validated['branch_id'] ?? $request->branch_id ?? null;
            if ($requestBranchId) {
                $branch = Branch::where('owner_id', $user->id)->find($requestBranchId);
                if (!$branch) {
                    return response()->json(['success' => false, 'message' => 'Cabang tidak ditemukan'], 404);
                }
                $branchId = $branch->id;
            }
        }

        $targetBankId = $bank->id;
        $targetSource = $bank->kode;

        if ($validated['jenis'] === 'restock_kas') {
            $laci = MasterBank::where('kode', 'laci')->first();
            $targetBankId = $laci?->id;
            $targetSource = 'laci';
        }

        $amount = (float) $validated['nominal'];

        if ($validated['jenis'] === 'tarik_tunai') {
            $laci = MasterBank::where('kode', 'laci')->first();
            $laciBalance = Balance::where('branch_id', $branchId)->where('bank_id', $laci?->id)->first();
            if ($laciBalance && (float) $laciBalance->saldo < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo kas tidak mencukupi (Rp ' . number_format($laciBalance->saldo, 0, ',', '.') . ')'
                ], 422);
            }
        } elseif (in_array($validated['jenis'], ['transfer', 'ppob'])) {
            $balance = Balance::where('branch_id', $branchId)->where('bank_id', $targetBankId)->first();
            if ($balance && (float) $balance->saldo < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Saldo ' . ($balance->bank?->nama ?? $targetSource) . ' tidak mencukupi (Rp ' . number_format($balance->saldo, 0, ',', '.') . ')'
                ], 422);
            }
        }

        $transaction = Transaction::create([
            'jenis' => $validated['jenis'],
            'source' => $targetSource,
            'bank_id' => $targetBankId,
            'nominal' => $validated['nominal'],
            'biaya_admin' => $validated['biaya_admin'] ?? 0,
            'keterangan' => $validated['keterangan'] ?? null,
            'saldo_kas_setelah' => 0,
            'saldo_digital_setelah' => 0,
            'branch_id' => $branchId,
        ]);

        if ($validated['jenis'] === 'tarik_tunai') {
            $laci = MasterBank::where('kode', 'laci')->first();
            Balance::updateBalance($branchId, $targetSource, $amount, $targetBankId);
            Balance::updateBalance($branchId, 'laci', -$amount, $laci?->id);
        } elseif ($validated['jenis'] === 'transfer') {
            $laci = MasterBank::where('kode', 'laci')->first();
            Balance::updateBalance($branchId, 'laci', $amount, $laci?->id);
            Balance::updateBalance($branchId, $targetSource, -$amount, $targetBankId);
        } elseif ($validated['jenis'] === 'ppob') {
            $laci = MasterBank::where('kode', 'laci')->first();
            Balance::updateBalance($branchId, 'laci', $amount, $laci?->id);
            Balance::updateBalance($branchId, $targetSource, -$amount, $targetBankId);
        } else {
            Balance::updateBalance($branchId, $targetSource, $amount, $targetBankId);
        }

        $allBalances = Balance::where('branch_id', $branchId)->with('bank')->get();
        $saldoKas = $allBalances->filter(fn($b) => $b->bank?->tipe === 'kas')->sum('saldo');
        $saldoDigital = $allBalances->filter(fn($b) => in_array($b->bank?->tipe, ['bank', 'e-wallet']))->sum('saldo');

        $transaction->update([
            'saldo_kas_setelah' => $saldoKas,
            'saldo_digital_setelah' => $saldoDigital,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil disimpan',
            'data' => $transaction->fresh()
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $transaction = Transaction::findOrFail($id);
        $branchId = $this->getBranchId($request);

        if ($branchId) {
            if ($transaction->branch_id != $branchId) {
                return response()->json(['success' => false, 'message' => 'Not found'], 404);
            }
        } elseif ($user->isOwner()) {
            $branchIds = Branch::where('owner_id', $user->id)->pluck('id');
            if (!in_array($transaction->branch_id, $branchIds->toArray())) {
                return response()->json(['success' => false, 'message' => 'Not found'], 404);
            }
        }

        $validated = $request->validate([
            'jenis' => 'required|in:tarik_tunai,transfer,ppob,topup_digital,restock_kas',
            'bank_id' => 'required|exists:master_banks,id',
            'nominal' => [
                'required',
                'numeric',
                'min:1000',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->jenis === 'topup_digital' && $value < 50000) {
                        $fail('Minimal topup digital Rp 50.000');
                    }
                    if ($request->jenis === 'restock_kas' && $value < 100000) {
                        $fail('Minimal restock kas Rp 100.000');
                    }
                },
            ],
            'biaya_admin' => 'nullable|numeric|min:0',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $bank = MasterBank::findOrFail($validated['bank_id']);
        $targetSource = $bank->kode;
        $targetBankId = $bank->id;

        if ($validated['jenis'] === 'restock_kas') {
            $laci = MasterBank::where('kode', 'laci')->first();
            $targetSource = 'laci';
            $targetBankId = $laci?->id;
        }

        $txBranchId = $transaction->branch_id;
        $transaction->update([
            'jenis' => $validated['jenis'],
            'source' => $targetSource,
            'bank_id' => $targetBankId,
            'nominal' => $validated['nominal'],
            'biaya_admin' => $validated['biaya_admin'] ?? 0,
            'keterangan' => $validated['keterangan'] ?? null,
        ]);

        Transaction::recalculateAllBalances($txBranchId);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil diperbarui',
            'data' => $transaction->fresh()
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $transaction = Transaction::findOrFail($id);
        $branchId = $this->getBranchId($request);

        if ($branchId) {
            if ($transaction->branch_id != $branchId) {
                return response()->json(['success' => false, 'message' => 'Not found'], 404);
            }
        } elseif ($user->isOwner()) {
            $branchIds = Branch::where('owner_id', $user->id)->pluck('id');
            if (!in_array($transaction->branch_id, $branchIds->toArray())) {
                return response()->json(['success' => false, 'message' => 'Not found'], 404);
            }
        }

        $txBranchId = $transaction->branch_id;
        $transaction->delete();

        Transaction::recalculateAllBalances($txBranchId);

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil dihapus'
        ]);
    }
}