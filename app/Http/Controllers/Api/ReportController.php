<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Exports\TransactionsExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function profitLoss(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now();

        $transactions = Transaction::whereBetween('created_at', [$startDate, $endDate])->get();

        // Asumsi: biaya admin nasabah rata-rata Rp 3.500 per transaksi
        // Biaya dari bank ke agen rata-rata Rp 2.000 per transaksi
        $adminFeeCustomer = 3500;
        $adminFeeBank = 2000;
        $profitPerTransaction = $adminFeeCustomer - $adminFeeBank;

        $totalTransactions = $transactions->count();
        $totalNominal = $transactions->sum('nominal');
        $totalProfit = $totalTransactions * $profitPerTransaction;

        // Group by date
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

    public function exportExcel()
{
    return Excel::download(new TransactionsExport, 'transactions_' . date('Y-m-d') . '.xlsx');
}

public function exportPdf()
{
    $transactions = Transaction::orderBy('created_at', 'desc')->get();
    $pdf = Pdf::loadView('pdf.transactions', compact('transactions'));
    return $pdf->download('transactions_' . date('Y-m-d') . '.pdf');
}
}