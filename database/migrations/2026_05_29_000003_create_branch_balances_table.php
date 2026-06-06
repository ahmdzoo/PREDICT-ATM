<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('branch_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->enum('source', ['laci', 'dana', 'gopay', 'bni', 'seabank', 'bri']);
            $table->decimal('saldo', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['branch_id', 'source']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_balances');
    }
};
