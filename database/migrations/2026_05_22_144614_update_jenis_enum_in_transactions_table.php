<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Hapus constraint enum yang lama
        DB::statement("ALTER TABLE transactions MODIFY jenis VARCHAR(50)");
        
        // Update data yang mungkin sudah ada
        DB::statement("UPDATE transactions SET jenis = 'tarik_tunai' WHERE jenis NOT IN ('tarik_tunai', 'setor_tunai', 'transfer', 'ppob')");
        
        // Buat ulang enum dengan nilai baru
        DB::statement("ALTER TABLE transactions MODIFY jenis ENUM('tarik_tunai', 'setor_tunai', 'transfer', 'ppob', 'topup_digital', 'restock_kas') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE transactions MODIFY jenis VARCHAR(50)");
        DB::statement("ALTER TABLE transactions MODIFY jenis ENUM('tarik_tunai', 'setor_tunai', 'transfer', 'ppob') NOT NULL");
    }
};