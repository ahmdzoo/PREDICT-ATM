<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BalanceController;
use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\CashController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MasterBankController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'updateProfile']);

    // Balances
    Route::get('/balances', [BalanceController::class, 'index']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/transactions-last-30-days', [DashboardController::class, 'last30Days']);

    // Transactions
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::get('/transactions/{id}', [TransactionController::class, 'show']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{id}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{id}', [TransactionController::class, 'destroy']);

    // Predictions
    Route::get('/prediction/current', [PredictionController::class, 'getCurrentPrediction']);
    Route::get('/prediction/chart', [PredictionController::class, 'getChartData']);

    // Cash management
    Route::post('/topup-digital', [CashController::class, 'topupDigital']);
    Route::post('/restock-kas', [CashController::class, 'restockKas']);

    // Reports & Exports
    Route::get('/export/excel', [ReportController::class, 'exportExcel']);
    Route::get('/export/pdf', [ReportController::class, 'exportPdf']);
    Route::get('/report/profit-loss', [ReportController::class, 'profitLoss']);

    // User management (owner only)
    Route::post('/register-admin', [AuthController::class, 'registerAdmin']);
    Route::get('/admins', [AuthController::class, 'listAdmins']);

    // Branches
    Route::get('/branches', [BranchController::class, 'index']);
    Route::post('/branches', [BranchController::class, 'store']);
    Route::get('/branches/{id}', [BranchController::class, 'show']);
    Route::put('/branches/{id}', [BranchController::class, 'update']);
    Route::delete('/branches/{id}', [BranchController::class, 'destroy']);

    // Master Banks
    Route::get('/master-banks', [MasterBankController::class, 'index']);
    Route::post('/master-banks', [MasterBankController::class, 'store']);
    Route::get('/master-banks/{id}', [MasterBankController::class, 'show']);
    Route::put('/master-banks/{id}', [MasterBankController::class, 'update']);
    Route::delete('/master-banks/{id}', [MasterBankController::class, 'destroy']);
});
