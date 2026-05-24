<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'jenis',
        'nominal',
        'saldo_kas_setelah',
        'saldo_digital_setelah',
        'keterangan'
    ];

    protected $casts = [
        'nominal' => 'decimal:2',
        'saldo_kas_setelah' => 'decimal:2',
        'saldo_digital_setelah' => 'decimal:2',
    ];
}