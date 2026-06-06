<?php

namespace Database\Seeders;

use App\Models\MasterBank;
use Illuminate\Database\Seeder;

class MasterBankSeeder extends Seeder
{
    public function run(): void
    {
        $banks = [
            ['nama' => 'Laci',     'kode' => 'laci',    'tipe' => 'kas',       'saldo_awal' => 5000000, 'keterangan' => 'Kas fisik di laci'],
            ['nama' => 'DANA',     'kode' => 'dana',    'tipe' => 'e-wallet',  'saldo_awal' => 1000000, 'keterangan' => 'Dompet digital DANA'],
            ['nama' => 'GoPay',    'kode' => 'gopay',   'tipe' => 'e-wallet',  'saldo_awal' => 500000,  'keterangan' => 'Dompet digital GoPay'],
            ['nama' => 'BNI',      'kode' => 'bni',     'tipe' => 'bank',      'saldo_awal' => 500000,  'keterangan' => 'Rekening BNI'],
            ['nama' => 'SeaBank',  'kode' => 'seabank', 'tipe' => 'bank',      'saldo_awal' => 500000,  'keterangan' => 'Rekening SeaBank'],
            ['nama' => 'BRI',      'kode' => 'bri',     'tipe' => 'bank',      'saldo_awal' => 500000,  'keterangan' => 'Rekening BRI'],
        ];

        foreach ($banks as $bank) {
            MasterBank::create($bank);
        }
    }
}
