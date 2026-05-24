<?php

namespace Database\Seeders;

use App\Models\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        // Hapus data lama
        Transaction::truncate();

        // Data dummy 30 hari dengan variasi naik turun
        $dataKas = [
            500000,
            800000,
            400000,
            900000,
            600000,  // Week 1
            1200000,
            700000,
            1000000,
            500000,
            1100000, // Week 2
            800000,
            1300000,
            600000,
            950000,
            700000,   // Week 3
            1400000,
            550000,
            1150000,
            650000,
            1250000, // Week 4
            750000,
            1000000,
            850000,
            500000,
            950000,   // Week 5
            1100000,
            600000,
            1200000,
            700000,
            1300000  // Week 6
        ];

        $dataTransfer = [
            200000,
            350000,
            150000,
            400000,
            250000,    // Week 1
            500000,
            300000,
            450000,
            200000,
            550000,    // Week 2
            350000,
            600000,
            250000,
            400000,
            300000,    // Week 3
            650000,
            200000,
            500000,
            280000,
            580000,    // Week 4
            320000,
            450000,
            220000,
            380000,
            420000,    // Week 5
            520000,
            280000,
            550000,
            320000,
            600000     // Week 6
        ];

        $saldoKas = 5000000;  // saldo awal kas
        $saldoDigital = 3000000; // saldo awal digital

        for ($i = 0; $i < count($dataKas); $i++) {
            // Insert transaksi Tarik Tunai
            $nominalKas = $dataKas[$i];
            $saldoKas -= $nominalKas;

            // Jaga agar saldo tidak negatif
            if ($saldoKas < 0) {
                $saldoKas = 5000000;
            }

            Transaction::create([
                'jenis' => 'tarik_tunai',
                'nominal' => $nominalKas,
                'saldo_kas_setelah' => $saldoKas,
                'saldo_digital_setelah' => $saldoDigital,
                'keterangan' => 'Seeder hari ke-' . ($i + 1),
                'created_at' => now()->subDays(count($dataKas) - $i),
            ]);

            // Insert transaksi Transfer
            $nominalTransfer = $dataTransfer[$i];
            $saldoDigital -= $nominalTransfer;

            // Jaga agar saldo tidak negatif
            if ($saldoDigital < 0) {
                $saldoDigital = 3000000;
            }

            Transaction::create([
                'jenis' => 'transfer',
                'nominal' => $nominalTransfer,
                'saldo_kas_setelah' => $saldoKas,
                'saldo_digital_setelah' => $saldoDigital,
                'keterangan' => 'Seeder hari ke-' . ($i + 1),
                'created_at' => now()->subDays(count($dataTransfer) - $i),
            ]);
        }

        $this->command->info('Seeder berhasil: ' . Transaction::count() . ' transaksi dibuat');
    }
}