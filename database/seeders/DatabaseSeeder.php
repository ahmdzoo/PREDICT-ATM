<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Branch;
use App\Models\Balance;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\MasterBankSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(MasterBankSeeder::class);

        $owner = User::factory()->create([
            'name' => 'Owner Utama',
            'email' => 'owner@example.com',
            'role' => 'owner',
        ]);

        $branch1 = Branch::create([
            'name' => 'Cabang Utama',
            'code' => 'UTAMA-001',
            'address' => 'Jl. Merdeka No. 123, Jakarta',
            'owner_id' => $owner->id,
        ]);

        $branch2 = Branch::create([
            'name' => 'Cabang Cabang',
            'code' => 'CBG-002',
            'address' => 'Jl. Sudirman No. 45, Bandung',
            'owner_id' => $owner->id,
        ]);

        $branch3 = Branch::create([
            'name' => 'Cabang Kemanggisan',
            'code' => 'KMG-003',
            'address' => 'Jl. Kemanggisan Raya No. 78, Jakarta Barat',
            'owner_id' => $owner->id,
        ]);

        $owner->update(['branch_id' => $branch1->id]);

        Balance::initBranchBalances($branch1->id);
        Balance::initBranchBalances($branch2->id);
        Balance::initBranchBalances($branch3->id);

        $admin1 = User::factory()->create([
            'name' => 'Admin Satu',
            'email' => 'admin1@example.com',
            'role' => 'admin',
            'password' => bcrypt('password'),
            'branch_id' => $branch1->id,
        ]);

        $admin2 = User::factory()->create([
            'name' => 'Admin Dua',
            'email' => 'admin2@example.com',
            'role' => 'admin',
            'password' => bcrypt('password'),
            'branch_id' => $branch2->id,
        ]);

        $admin3 = User::factory()->create([
            'name' => 'Admin Tiga',
            'email' => 'admin3@example.com',
            'role' => 'admin',
            'password' => bcrypt('password'),
            'branch_id' => $branch3->id,
        ]);

        TransactionSeeder::$branchId = $branch1->id;
        TransactionSeeder::$variant = 1;
        $this->call(TransactionSeeder::class);

        TransactionSeeder::$branchId = $branch2->id;
        TransactionSeeder::$variant = 2;
        $this->call(TransactionSeeder::class);

        TransactionSeeder::$branchId = $branch3->id;
        TransactionSeeder::$variant = 1;
        $this->call(TransactionSeeder::class);

        $this->command->info('Seeder berhasil!');
        $this->command->warn('Owner: owner@example.com / password');
        $this->command->warn('Admin 1: admin1@example.com / password (Cabang Utama)');
        $this->command->warn('Admin 2: admin2@example.com / password (Cabang Cabang)');
        $this->command->warn('Admin 3: admin3@example.com / password (Cabang Kemanggisan)');
    }
}
