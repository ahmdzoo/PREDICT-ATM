<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Balance extends Model
{
    use HasFactory;

    protected $table = 'branch_balances';

    protected $fillable = [
        'branch_id',
        'source',
        'bank_id',
        'saldo',
    ];

    protected $casts = [
        'saldo' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function bank()
    {
        return $this->belongsTo(MasterBank::class, 'bank_id');
    }

    public static function biayaAdminDefaults(): array
    {
        return [
            'tarik_tunai' => 1500,
            'transfer' => 3500,
            'ppob' => 2500,
            'topup_digital' => 0,
            'restock_kas' => 0,
        ];
    }

    public static function initBranchBalances(int $branchId): void
    {
        $banks = MasterBank::where('is_active', true)->get();
        foreach ($banks as $bank) {
            self::create([
                'branch_id' => $branchId,
                'source' => $bank->kode,
                'bank_id' => $bank->id,
                'saldo' => $bank->saldo_awal,
            ]);
        }
    }

    public static function updateBalance(int $branchId, string $source, float $amount, ?int $bankId = null): void
    {
        $query = self::where('branch_id', $branchId);
        if ($bankId) {
            $query->where('bank_id', $bankId);
        } else {
            $query->where('source', $source);
        }
        $balance = $query->first();
        if ($balance) {
            $balance->increment('saldo', $amount);
        }
    }
}
