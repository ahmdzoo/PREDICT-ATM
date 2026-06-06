<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\BranchScope;
use App\Models\Balance;
use App\Models\MasterBank;
use Illuminate\Http\Request;

class BalanceController extends Controller
{
    use BranchScope;

    public function index(Request $request)
    {
        $branchId = $this->getBranchId($request);

        $query = Balance::query()->with('branch')->with('bank');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        } else {
            $user = $request->user();
            if ($user->isOwner()) {
                $branchIds = $user->ownedBranches()->pluck('id');
                $query->whereIn('branch_id', $branchIds);
            }
        }

        $balances = $query->orderBy('branch_id')->get()->groupBy('branch_id');

        $result = [];
        foreach ($balances as $bId => $items) {
            $branch = $items->first()->branch;
            $sources = [];
            $totalSaldo = 0;
            foreach ($items as $b) {
                $sources[] = [
                    'bank_id' => $b->bank_id,
                    'source' => $b->source,
                    'nama' => $b->bank?->nama ?? $b->source,
                    'tipe' => $b->bank?->tipe ?? null,
                    'saldo' => (int) $b->saldo,
                ];
                $totalSaldo += (int) $b->saldo;
            }
            $result[] = [
                'branch_id' => $bId,
                'branch_name' => $branch?->name ?? 'Cabang #' . $bId,
                'sources' => $sources,
                'total_saldo' => $totalSaldo,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
