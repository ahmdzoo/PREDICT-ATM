<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('jenis', ['tarik_tunai', 'setor_tunai', 'transfer', 'ppob']);
            $table->decimal('nominal', 15, 2);
            $table->decimal('saldo_kas_setelah', 15, 2);
            $table->decimal('saldo_digital_setelah', 15, 2);
            $table->string('keterangan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};