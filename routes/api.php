<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\PredictionController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

// Transaction routes
Route::get('/transactions', [TransactionController::class, 'index']);
Route::post('/transactions', [TransactionController::class, 'store']);

// Dashboard routes
Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
Route::get('/dashboard/transactions-last-30-days', [DashboardController::class, 'last30Days']);

// Prediction routes
Route::get('/prediction/current', [PredictionController::class, 'getCurrentPrediction']);
Route::post('/prediction/calculate', [PredictionController::class, 'calculate']);