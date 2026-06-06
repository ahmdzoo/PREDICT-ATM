<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'jenis',
        'source',
        'bank_id',
        'nominal',
        'biaya_admin',
        'saldo_kas_setelah',
        'saldo_digital_setelah',
        'keterangan',
        'branch_id',
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'biaya_admin' => 'decimal:2',
        'saldo_kas_setelah' => 'decimal:2',
        'saldo_digital_setelah' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function bank()
    {
        return $this->belongsTo(MasterBank::class, 'bank_id');
    }

    public static function sumberByJenis(string $jenis): array
    {
        $banks = MasterBank::getForJenis($jenis);
        return $banks->pluck('kode')->toArray();
    }

    public static function processTransaction(array $data): self
    {
        $data['saldo_kas_setelah'] = 0;
        $data['saldo_digital_setelah'] = 0;

        $tx = self::create($data);

        $amount = (float) $data['nominal'];
        $source = $data['source'] ?? 'laci';
        $bankId = $data['bank_id'] ?? null;
        $branchId = $data['branch_id'];

        $targetSource = $source;
        $targetBankId = $bankId;

        if ($tx->jenis === 'restock_kas') {
            $laci = MasterBank::where('kode', 'laci')->first();
            $targetSource = 'laci';
            $targetBankId = $laci?->id;
        }

        if ($tx->jenis === 'tarik_tunai') {
            $laci = MasterBank::where('kode', 'laci')->first();
            Balance::updateBalance($branchId, $targetSource, $amount, $targetBankId);
            Balance::updateBalance($branchId, 'laci', -$amount, $laci?->id);
        } elseif ($tx->jenis === 'transfer') {
            $laci = MasterBank::where('kode', 'laci')->first();
            Balance::updateBalance($branchId, 'laci', $amount, $laci?->id);
            Balance::updateBalance($branchId, $targetSource, -$amount, $targetBankId);
        } elseif ($tx->jenis === 'ppob') {
            $laci = MasterBank::where('kode', 'laci')->first();
            Balance::updateBalance($branchId, 'laci', $amount, $laci?->id);
            Balance::updateBalance($branchId, $targetSource, -$amount, $targetBankId);
        } else {
            Balance::updateBalance($branchId, $targetSource, $amount, $targetBankId);
        }

        $allBalances = Balance::where('branch_id', $branchId)->with('bank')->get();
        $tx->saldo_kas_setelah = $allBalances->filter(fn($b) => $b->bank?->tipe === 'kas')->sum('saldo');
        $tx->saldo_digital_setelah = $allBalances->filter(fn($b) => in_array($b->bank?->tipe, ['bank', 'e-wallet']))->sum('saldo');
        $tx->save();

        return $tx->fresh();
    }

    public static function recalculateAllBalances($branchId = null): void
    {
        $branches = $branchId ? [$branchId] : Balance::distinct()->pluck('branch_id')->toArray();

        foreach ($branches as $bId) {
            Balance::where('branch_id', $bId)->delete();
            Balance::initBranchBalances($bId);

            $transactions = self::where('branch_id', $bId)->orderBy('created_at', 'asc')->get();

            foreach ($transactions as $tx) {
                $amount = (float) $tx->nominal;
                $source = $tx->source ?? 'laci';
                $bankId = $tx->bank_id;

                $targetSource = $source;
                $targetBankId = $bankId;

                if ($tx->jenis === 'restock_kas') {
                    $laci = MasterBank::where('kode', 'laci')->first();
                    $targetSource = 'laci';
                    $targetBankId = $laci?->id;
                }

                if ($tx->jenis === 'tarik_tunai') {
                    $laci = MasterBank::where('kode', 'laci')->first();
                    Balance::updateBalance($bId, $targetSource, $amount, $targetBankId);
                    Balance::updateBalance($bId, 'laci', -$amount, $laci?->id);
                } elseif ($tx->jenis === 'transfer') {
                    $laci = MasterBank::where('kode', 'laci')->first();
                    Balance::updateBalance($bId, 'laci', $amount, $laci?->id);
                    Balance::updateBalance($bId, $targetSource, -$amount, $targetBankId);
                } elseif ($tx->jenis === 'ppob') {
                    $laci = MasterBank::where('kode', 'laci')->first();
                    Balance::updateBalance($bId, 'laci', $amount, $laci?->id);
                    Balance::updateBalance($bId, $targetSource, -$amount, $targetBankId);
                } else {
                    Balance::updateBalance($bId, $targetSource, $amount, $targetBankId);
                }

                $allBalances = Balance::where('branch_id', $bId)->with('bank')->get();
                $saldoKas = $allBalances->filter(fn($b) => $b->bank?->tipe === 'kas')->sum('saldo');
                $saldoDigital = $allBalances->filter(fn($b) => in_array($b->bank?->tipe, ['bank', 'e-wallet']))->sum('saldo');

                $tx->update([
                    'saldo_kas_setelah' => $saldoKas,
                    'saldo_digital_setelah' => $saldoDigital,
                ]);
            }
        }
    }
}