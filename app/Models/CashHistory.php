<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashHistory extends Model
{
    protected $fillable = [
        'type', 
        'amount', 
        'balance_before', 
        'balance_after', 
        'description', 
        'user_id'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}