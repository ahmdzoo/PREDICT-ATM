<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::getDriverName();

        // Add bank_id to branch_balances
        Schema::table('branch_balances', function (Blueprint $table) {
            $table->foreignId('bank_id')->nullable()->after('source')->constrained('master_banks')->nullOnDelete();
        });

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE branch_balances MODIFY COLUMN source VARCHAR(50) NULL');
        }

        // Add bank_id to transactions
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('bank_id')->nullable()->after('source')->constrained('master_banks')->nullOnDelete();
        });

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE transactions MODIFY COLUMN source VARCHAR(50) NULL');
        }

        // Backfill bank_id based on source matching kode in master_banks
        DB::statement('UPDATE branch_balances SET bank_id = (SELECT id FROM master_banks WHERE kode = source) WHERE bank_id IS NULL');
        DB::statement('UPDATE transactions SET bank_id = (SELECT id FROM master_banks WHERE kode = source) WHERE bank_id IS NULL');
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['bank_id']);
            $table->dropColumn('bank_id');
        });

        Schema::table('branch_balances', function (Blueprint $table) {
            $table->dropForeign(['bank_id']);
            $table->dropColumn('bank_id');
        });
    }
};
