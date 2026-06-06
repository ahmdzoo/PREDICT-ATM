<?php

namespace Database\Seeders;

use App\Models\MasterBank;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public static $branchId = null;
    public static $variant = 1;

    public function run(): void
    {
        $branchId = static::$branchId;

        if (!$branchId) {
            $this->command->warn('TransactionSeeder: branch_id tidak diset, skip');
            return;
        }

        $variant = static::$variant;

        if ($variant === 1) {
            $dataKas = [
                500000, 800000, 400000, 900000, 600000,
                1200000, 700000, 1000000, 500000, 1100000,
                800000, 1300000, 600000, 950000, 700000,
                1400000, 550000, 1150000, 650000, 1250000,
                750000, 1000000, 850000, 500000, 950000,
                1100000, 600000, 1200000, 700000, 1300000,
            ];
            $dataTransfer = [
                200000, 350000, 150000, 400000, 250000,
                500000, 300000, 450000, 200000, 550000,
                350000, 600000, 250000, 400000, 300000,
                650000, 200000, 500000, 280000, 580000,
                320000, 450000, 220000, 380000, 420000,
                520000, 280000, 550000, 320000, 600000,
            ];
        } else {
            $dataKas = [
                250000, 400000, 150000, 600000, 300000,
                700000, 350000, 500000, 200000, 800000,
                450000, 900000, 300000, 550000, 400000,
                1000000, 250000, 750000, 350000, 850000,
                500000, 600000, 300000, 350000, 650000,
                700000, 400000, 800000, 450000, 900000,
            ];
            $dataTransfer = [
                100000, 150000, 50000, 200000, 100000,
                250000, 150000, 200000, 100000, 300000,
                180000, 350000, 120000, 250000, 150000,
                400000, 100000, 280000, 150000, 350000,
                180000, 250000, 100000, 150000, 220000,
                300000, 150000, 320000, 180000, 350000,
            ];
        }

        $bankLaci = MasterBank::where('kode', 'laci')->first();
        $bankSources = MasterBank::whereIn('kode', ['dana', 'gopay', 'bni', 'seabank', 'bri'])->pluck('id', 'kode');
        $topupSchedule = ['dana', 'gopay', 'bni', 'seabank', 'bri'];

        $restockNominal = $variant === 1 ? 3000000 : 2000000;

        for ($i = 0; $i < count($dataKas); $i++) {
            $hariKe = $i + 1;
            $tanggal = now()->subDays(count($dataKas) - $i);

            // Every 5 days: restock_kas to keep laci positive
            if ($hariKe % 5 === 0) {
                Transaction::create([
                    'jenis' => 'restock_kas',
                    'source' => 'laci',
                    'bank_id' => $bankLaci?->id,
                    'nominal' => $restockNominal,
                    'biaya_admin' => 0,
                    'saldo_kas_setelah' => 0,
                    'saldo_digital_setelah' => 0,
                    'keterangan' => 'Restock kas hari ke-' . $hariKe,
                    'created_at' => $tanggal,
                    'branch_id' => $branchId,
                ]);
            }

            // Every 5 days starting from day 3: topup_digital cycling through banks
            if ($hariKe % 5 === 3) {
                $bankKey = $topupSchedule[($hariKe / 5) % count($topupSchedule)];
                $topupNominal = $variant === 1 ? 2500000 : 1500000;
                Transaction::create([
                    'jenis' => 'topup_digital',
                    'source' => $bankKey,
                    'bank_id' => $bankSources[$bankKey] ?? null,
                    'nominal' => $topupNominal,
                    'biaya_admin' => 0,
                    'saldo_kas_setelah' => 0,
                    'saldo_digital_setelah' => 0,
                    'keterangan' => 'Topup ' . $bankKey . ' hari ke-' . $hariKe,
                    'created_at' => $tanggal,
                    'branch_id' => $branchId,
                ]);
            }

            $sourceKeys = ['dana', 'gopay', 'bni', 'seabank', 'bri'];
            $tarikKey = $sourceKeys[$i % count($sourceKeys)];
            Transaction::create([
                'jenis' => 'tarik_tunai',
                'source' => $tarikKey,
                'bank_id' => $bankSources[$tarikKey] ?? null,
                'nominal' => $dataKas[$i],
                'biaya_admin' => 1500,
                'saldo_kas_setelah' => 0,
                'saldo_digital_setelah' => 0,
                'keterangan' => 'Seeder hari ke-' . $hariKe,
                'created_at' => $tanggal,
                'branch_id' => $branchId,
            ]);

            $key = $sourceKeys[$i % count($sourceKeys)];
            Transaction::create([
                'jenis' => 'transfer',
                'source' => $key,
                'bank_id' => $bankSources[$key] ?? null,
                'nominal' => $dataTransfer[$i],
                'biaya_admin' => 3500,
                'saldo_kas_setelah' => 0,
                'saldo_digital_setelah' => 0,
                'keterangan' => 'Seeder hari ke-' . $hariKe,
                'created_at' => $tanggal,
                'branch_id' => $branchId,
            ]);
        }

        Transaction::recalculateAllBalances($branchId);

        $this->command->info('Seeder berhasil: ' . Transaction::count() . ' transaksi dibuat');
    }
}
