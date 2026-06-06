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

class PredictionController extends Controller
{
    use BranchScope;

    public function getCurrentPrediction(Request $request)
    {
        $user = $request->user();
        $branchId = $this->getBranchId($request);

        $userBranches = $user->isOwner()
            ? Branch::where('owner_id', $user->id)->pluck('id')
            : collect([$user->branch_id]);

        $transactions = Transaction::where('created_at', '>=', now()->subDays(30))
            ->whereIn('branch_id', $userBranches)
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

        $historicalKas = [];
        foreach ($transactions as $t) {
            if ($t->jenis === 'tarik_tunai') {
                $historicalKas[] = (float) $t->nominal;
            }
        }

        $historicalDigital = [];
        foreach ($transactions as $t) {
            if ($t->jenis === 'transfer') {
                $historicalDigital[] = (float) $t->nominal;
            }
        }

        if (count($historicalKas) < 3) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'Data tarik tunai belum cukup untuk prediksi. Butuh minimal 3 transaksi. Saat ini: ' . count($historicalKas)
                ]
            ]);
        }

        $optimalKas = SESService::findOptimalAlpha($historicalKas);
        $optimalDigital = (count($historicalDigital) >= 3) ? SESService::findOptimalAlpha($historicalDigital) : ['alpha' => 0.5, 'mape' => 0];

        $prediksiKas = SESService::forecast($historicalKas, $optimalKas['alpha']);
        $prediksiDigital = (count($historicalDigital) >= 3) ? SESService::forecast($historicalDigital, $optimalDigital['alpha']) : 0;

        $saldoKasSekarang = 0;
        $saldoDigitalSekarang = 0;
        $masterBanks = MasterBank::where('is_active', true)->get();
        $balances = Balance::whereIn('branch_id', $userBranches)->with('bank')->get();
        foreach ($balances as $b) {
            $bank = $masterBanks->firstWhere('id', $b->bank_id);
            if ($bank && $bank->tipe === 'kas') {
                $saldoKasSekarang += (float) $b->saldo;
            } elseif ($bank) {
                $saldoDigitalSekarang += (float) $b->saldo;
            }
        }

        $bufferPersen = 20;
        $rekomendasiKas = max(0, ($prediksiKas * (100 + $bufferPersen) / 100) - $saldoKasSekarang);
        $rekomendasiDigital = max(0, ($prediksiDigital * (100 + $bufferPersen) / 100) - $saldoDigitalSekarang);

        return response()->json([
            'success' => true,
            'data' => [
                'prediksi_kas' => (int) round($prediksiKas, 0),
                'prediksi_digital' => (int) round($prediksiDigital, 0),
                'alpha_kas' => $optimalKas['alpha'],
                'alpha_digital' => $optimalDigital['alpha'],
                'mape_kas' => $optimalKas['mape'],
                'mape_digital' => $optimalDigital['mape'],
                'saldo_kas_sekarang' => (int) $saldoKasSekarang,
                'saldo_digital_sekarang' => (int) $saldoDigitalSekarang,
                'rekomendasi_kas' => (int) round($rekomendasiKas, 0),
                'rekomendasi_digital' => (int) round($rekomendasiDigital, 0),
                'jumlah_data_kas' => count($historicalKas),
                'jumlah_data_digital' => count($historicalDigital),
            ]
        ]);
    }

    public function getChartData(Request $request)
    {
        $user = $request->user();
        $branchId = $this->getBranchId($request);

        $userBranches = $user->isOwner()
            ? Branch::where('owner_id', $user->id)->pluck('id')
            : collect([$user->branch_id]);

        $transactions = Transaction::where('created_at', '>=', now()->subDays(30))
            ->whereIn('branch_id', $userBranches)
            ->orderBy('created_at', 'asc')
            ->get();

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

        $forecasts = [];
        $forecast = $historicalKas[0];

        for ($i = 0; $i < count($historicalKas); $i++) {
            $forecasts[] = round($forecast, 0);
            if ($i < count($historicalKas) - 1) {
                $forecast = ($optimal['alpha'] * $historicalKas[$i]) + ((1 - $optimal['alpha']) * $forecast);
            }
        }

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
