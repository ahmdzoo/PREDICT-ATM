<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\BranchScope;
use App\Models\Balance;
use App\Models\Branch;
use App\Models\MasterBank;
use App\Models\Transaction;
use App\Services\SESService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use BranchScope;

    public function summary(Request $request)
    {
        $user = $request->user();
        $branchId = $this->getBranchId($request);
        $isAllBranches = $user->isOwner() && !$branchId;

        $userBranches = $user->isOwner()
            ? Branch::where('owner_id', $user->id)->pluck('id')
            : collect([$user->branch_id]);

        $todayTransactions = Transaction::whereDate('created_at', today())
            ->whereIn('branch_id', $userBranches);
        $todayCount = $todayTransactions->count();

        $todayProfit = (clone $todayTransactions)->sum('biaya_admin');

        $totalProfit = Transaction::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->whereIn('branch_id', $userBranches);
        $monthProfit = $totalProfit->sum('biaya_admin');

        $masterBanks = MasterBank::where('is_active', true)->orderBy('tipe')->orderBy('id')->get();

        $totalSaldoAll = 0;
        $aggregateSources = [];
        $branchesSummary = [];

        foreach ($userBranches as $bId) {
            if (!Balance::where('branch_id', $bId)->exists()) {
                Balance::initBranchBalances($bId);
            }
            $balances = Balance::where('branch_id', $bId)->with('bank')->get()->keyBy('bank_id');
            $today = Transaction::where('branch_id', $bId)->whereDate('created_at', today())->count();
            $branch = Branch::find($bId);

            $sourceData = [];
            $branchTotal = 0;
            foreach ($masterBanks as $bank) {
                $bal = $balances->get($bank->id);
                $saldo = $bal ? (int) $bal->saldo : 0;
                $sourceData[$bank->kode] = $saldo;
                $branchTotal += $saldo;
            }

            if ($isAllBranches) {
                foreach ($masterBanks as $bank) {
                    $kode = $bank->kode;
                    if (!isset($aggregateSources[$kode])) {
                        $aggregateSources[$kode] = 0;
                    }
                    $aggregateSources[$kode] += $sourceData[$kode];
                }

                $branchKas = 0;
                $branchDigital = 0;
                foreach ($masterBanks as $bank) {
                    $saldo = $sourceData[$bank->kode] ?? 0;
                    if ($bank->tipe === 'kas') {
                        $branchKas += $saldo;
                    } else {
                        $branchDigital += $saldo;
                    }
                }
                $branchStatus = ($branchKas < 2000000 || $branchDigital < 1000000) ? 'kritis'
                    : (($branchKas < 4000000 || $branchDigital < 2000000) ? 'warning' : 'aman');

                $branchesSummary[] = [
                    'id' => $bId,
                    'name' => $branch?->name ?? 'Cabang #' . $bId,
                    'sources' => $sourceData,
                    'total_saldo' => $branchTotal,
                    'saldo_kas' => $branchKas,
                    'saldo_digital' => $branchDigital,
                    'status_likuiditas' => $branchStatus,
                    'transaksi_hari_ini' => $today,
                ];
            }

            if ($branchId && $bId == $branchId) {
                $totalSaldoAll = $branchTotal;
            } elseif (!$branchId) {
                $totalSaldoAll += $branchTotal;
            }
        }

        $sourcesBalance = [];
        foreach ($masterBanks as $bank) {
            if ($branchId) {
                $b = Balance::where('branch_id', $branchId)->where('bank_id', $bank->id)->first();
                $saldo = $b ? (int) $b->saldo : 0;
            } else {
                $saldo = $aggregateSources[$bank->kode] ?? 0;
            }
            $sourcesBalance[] = [
                'bank_id' => $bank->id,
                'source' => $bank->kode,
                'label' => $bank->nama,
                'tipe' => $bank->tipe,
                'saldo' => $saldo,
            ];
        }

        $status = 'aman';
        $laciSaldo = 0;
        $digitalTotal = 0;
        foreach ($sourcesBalance as $s) {
            if ($s['tipe'] === 'kas') {
                $laciSaldo += $s['saldo'];
            } else {
                $digitalTotal += $s['saldo'];
            }
        }

        if ($laciSaldo < 2000000 || $digitalTotal < 1000000) {
            $status = 'kritis';
        } elseif ($laciSaldo < 4000000 || $digitalTotal < 2000000) {
            $status = 'warning';
        }

        $prediksiKas = null;
        $prediksiDigital = null;

        $recentTransactions = Transaction::where('created_at', '>=', now()->subDays(30))
            ->whereIn('branch_id', $userBranches)
            ->orderBy('created_at', 'asc')
            ->get();

        if ($recentTransactions->count() >= 7) {
            $historicalKas = SESService::prepareHistoricalData($recentTransactions, 'tarik_tunai');
            $historicalDigital = SESService::prepareHistoricalData($recentTransactions, 'transfer');

            if (count($historicalKas) >= 3) {
                $optimalKas = SESService::findOptimalAlpha($historicalKas);
                $prediksiKas = (int) round(SESService::forecast($historicalKas, $optimalKas['alpha']), 0);
            }

            if (count($historicalDigital) >= 3) {
                $optimalDigital = SESService::findOptimalAlpha($historicalDigital);
                $prediksiDigital = (int) round(SESService::forecast($historicalDigital, $optimalDigital['alpha']), 0);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_transaksi_hari_ini' => $todayCount,
                'profit_hari_ini' => (int) $todayProfit,
                'profit_bulan_ini' => (int) $monthProfit,
                'total_saldo' => (int) $totalSaldoAll,
                'saldo_kas_terkini' => (int) $laciSaldo,
                'saldo_digital_terkini' => (int) $digitalTotal,
                'status_likuiditas' => $status,
                'sources' => $sourcesBalance,
                'prediksi_kas_besok' => $prediksiKas,
                'prediksi_digital_besok' => $prediksiDigital,
                'branches' => $isAllBranches ? $branchesSummary : null,
                'is_all_branches' => $isAllBranches,
            ]
        ]);
    }

    public function last30Days(Request $request)
    {
        $user = $request->user();
        $branchId = $this->getBranchId($request);

        $userBranches = $user->isOwner()
            ? Branch::where('owner_id', $user->id)->pluck('id')
            : collect([$user->branch_id]);

        $query = Transaction::where('created_at', '>=', now()->subDays(30))
            ->whereIn('branch_id', $userBranches);

        $transactions = $query->orderBy('created_at', 'asc')
            ->get()
            ->groupBy(function ($date) {
                return $date->created_at->format('Y-m-d');
            })
            ->map(function ($day) {
                return [
                    'tanggal' => $day->first()->created_at->format('Y-m-d'),
                    'total_tarik' => $day->where('jenis', 'tarik_tunai')->sum('nominal'),
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
