<?php

namespace App\Services;

class SESService
{
    /**
     * Hitung prediksi next period dengan Single Exponential Smoothing
     * Rumus: Ft+1 = α × Yt + (1-α) × Ft
     * 
     * @param array $actuals Data aktual (array numeric, urut dari lama ke baru)
     * @param float $alpha Konstanta smoothing (0-1)
     * @return float Nilai prediksi untuk periode berikutnya
     */
    public static function forecast(array $actuals, float $alpha): float
    {
        if (empty($actuals)) {
            return 0;
        }

        if (count($actuals) === 1) {
            return $actuals[0];
        }

        // Inisialisasi forecast pertama = nilai aktual pertama
        $forecast = $actuals[0];

        // Hitung forecast untuk setiap periode
        for ($i = 1; $i < count($actuals); $i++) {
            $forecast = ($alpha * $actuals[$i - 1]) + ((1 - $alpha) * $forecast);
        }

        return round($forecast, 2);
    }

    /**
     * Hitung MAPE (Mean Absolute Percentage Error)
     * Untuk mengukur akurasi forecast
     * 
     * @param array $actuals Data aktual
     * @param float $alpha Nilai alpha yang akan diuji
     * @return float Nilai MAPE (semakin kecil semakin baik)
     */
    public static function calculateMAPE(array $actuals, float $alpha): float
    {
        if (count($actuals) < 2) {
            return 0;
        }

        $errors = [];
        $forecast = $actuals[0];

        for ($i = 1; $i < count($actuals); $i++) {
            $actual = $actuals[$i];
            if ($actual == 0) {
                continue;
            }

            $error = abs(($actual - $forecast) / $actual) * 100;
            $errors[] = $error;

            // Update forecast untuk iterasi berikutnya
            $forecast = ($alpha * $actuals[$i - 1]) + ((1 - $alpha) * $forecast);
        }

        if (empty($errors)) {
            return 0;
        }

        return round(array_sum($errors) / count($errors), 2);
    }

    /**
     * Cari alpha optimal (nilai dengan MAPE terkecil)
     * 
     * @param array $actuals Data aktual
     * @return array ['alpha' => float, 'mape' => float]
     */
    public static function findOptimalAlpha(array $actuals): array
    {
        $alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
        $bestAlpha = 0.5;
        $bestMAPE = PHP_FLOAT_MAX;

        foreach ($alphas as $alpha) {
            $mape = self::calculateMAPE($actuals, $alpha);
            if ($mape < $bestMAPE) {
                $bestMAPE = $mape;
                $bestAlpha = $alpha;
            }
        }

        return [
            'alpha' => $bestAlpha,
            'mape' => $bestMAPE
        ];
    }

    /**
     * Get data historis untuk forecasting
     * 
     * @param array $transactions Data transaksi dari database
     * @param string $field Field yang akan di-forecast (nominal)
     * @param string $jenis Jenis transaksi (tarik_tunai atau transfer)
     * @return array
     */
    public static function prepareHistoricalData($transactions, string $jenis): array
    {
        $filtered = $transactions->filter(function ($transaction) use ($jenis) {
            return $transaction->jenis === $jenis;
        });

        return $filtered->pluck('nominal')->values()->toArray();
    }
}