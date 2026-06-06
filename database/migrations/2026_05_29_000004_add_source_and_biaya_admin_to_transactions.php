<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->enum('source', ['laci', 'dana', 'gopay', 'bni', 'seabank', 'bri'])->nullable()->after('jenis');
            $table->decimal('biaya_admin', 15, 2)->default(0)->after('nominal');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('source');
            $table->dropColumn('biaya_admin');
        });
    }
};
