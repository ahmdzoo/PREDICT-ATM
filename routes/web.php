<?php

use App\Http\Controllers\Api\CashController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// ========== API ROUTES ==========
Route::middleware(['auth'])->group(function () {
    // Transaksi
    Route::get('/api/transactions', [TransactionController::class, 'index']);
    Route::post('/api/transactions', [TransactionController::class, 'store']);
    
    // Prediksi
    Route::get('/api/prediction/current', [PredictionController::class, 'getCurrentPrediction']);
    Route::get('/api/prediction/chart', [PredictionController::class, 'getChartData']);
    
    // Cash (Topup & Restock)
    Route::post('/api/topup-digital', [CashController::class, 'topupDigital']);
    Route::post('/api/restock-kas', [CashController::class, 'restockKas']);
    
    // Export
    Route::get('/export/excel', [ReportController::class, 'exportExcel']);
    Route::get('/export/pdf', [ReportController::class, 'exportPdf']);
});
// =================================

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';