<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterBank extends Model
{
    protected $table = 'master_banks';

    protected $fillable = [
        'nama',
        'kode',
        'tipe',
        'saldo_awal',
        'is_active',
        'keterangan',
    ];

    protected $casts = [
        'saldo_awal' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function balances()
    {
        return $this->hasMany(Balance::class, 'bank_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'bank_id');
    }

    public static function getByTipe(string $tipe)
    {
        return self::where('tipe', $tipe)->where('is_active', true)->get();
    }

    public static function getForJenis(string $jenis)
    {
        if (in_array($jenis, ['restock_kas'])) {
            return self::where('tipe', 'kas')->where('is_active', true)->get();
        }
        return self::whereIn('tipe', ['bank', 'e-wallet'])->where('is_active', true)->get();
    }
}
