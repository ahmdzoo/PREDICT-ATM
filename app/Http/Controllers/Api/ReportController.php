<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Traits\BranchScope;
use App\Models\Transaction;
use App\Exports\TransactionsExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use BranchScope;

    public function profitLoss(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now();

        $query = Transaction::whereBetween('created_at', [$startDate, $endDate]);
        $query = $this->applyBranchScope($query, $request);
        $transactions = $query->get();

        $adminFeeCustomer = 3500;
        $adminFeeBank = 2000;
        $profitPerTransaction = $adminFeeCustomer - $adminFeeBank;

        $totalTransactions = $transactions->count();
        $totalNominal = $transactions->sum('nominal');
        $totalProfit = $totalTransactions * $profitPerTransaction;

        $dailyProfit = $transactions->groupBy(function ($t) {
            return $t->created_at->format('Y-m-d');
        })->map(function ($day) use ($profitPerTransaction) {
            return [
                'date' => $day->first()->created_at->format('d M Y'),
                'transactions' => $day->count(),
                'profit' => $day->count() * $profitPerTransaction,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start' => $startDate,
                    'end' => $endDate,
                ],
                'summary' => [
                    'total_transactions' => $totalTransactions,
                    'total_nominal' => $totalNominal,
                    'total_profit' => $totalProfit,
                    'profit_per_transaction' => $profitPerTransaction,
                ],
                'daily' => $dailyProfit,
            ]
        ]);
    }

    public function exportExcel(Request $request)
    {
        $branchId = $this->getBranchId($request);
        return Excel::download(new TransactionsExport($branchId), 'transactions_' . date('Y-m-d') . '.xlsx');
    }

    public function exportPdf(Request $request)
    {
        $branchId = $this->getBranchId($request);

        $query = Transaction::orderBy('created_at', 'desc');
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        $transactions = $query->get();

        $pdf = Pdf::loadView('pdf.transactions', compact('transactions'));
        return $pdf->download('transactions_' . date('Y-m-d') . '.pdf');
    }
}
