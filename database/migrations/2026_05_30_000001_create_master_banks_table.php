<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('master_banks', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->string('kode', 50)->unique();
            $table->enum('tipe', ['kas', 'e-wallet', 'bank']);
            $table->decimal('saldo_awal', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_banks');
    }
};
