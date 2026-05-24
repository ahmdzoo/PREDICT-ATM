<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class TransactionsExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Transaction::orderBy('created_at', 'desc')->get();
    }
    
    public function headings(): array
    {
        return ['ID', 'Jenis', 'Nominal', 'Saldo Kas', 'Saldo Digital', 'Keterangan', 'Tanggal'];
    }
    
    public function map($transaction): array
    {
        return [
            $transaction->id,
            $transaction->jenis,
            $transaction->nominal,
            $transaction->saldo_kas_setelah,
            $transaction->saldo_digital_setelah,
            $transaction->keterangan,
            $transaction->created_at,
        ];
    }
}