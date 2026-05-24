<!DOCTYPE html>
<html>
<head>
    <title>Laporan Transaksi Mini ATM</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
        }
        h1 {
            color: #4f46e5;
            text-align: center;
            margin-bottom: 5px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #4f46e5;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-size: 12px;
            color: #666;
        }
        .total {
            margin-top: 20px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>🏧 Laporan Transaksi Mini ATM</h1>
    <div class="subtitle">
        BRI Link - Periode: {{ now()->format('d/m/Y H:i:s') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Nominal</th>
                <th>Saldo Kas</th>
                <th>Saldo Digital</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $index => $t)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $t->created_at->format('d/m/Y H:i') }}</td>
                <td>
                    @if($t->jenis == 'tarik_tunai') Tarik Tunai
                    @elseif($t->jenis == 'setor_tunai') Setor Tunai
                    @elseif($t->jenis == 'transfer') Transfer
                    @elseif($t->jenis == 'ppob') PPOB
                    @elseif($t->jenis == 'topup_digital') Topup Digital
                    @elseif($t->jenis == 'restock_kas') Restock Kas
                    @else {{ $t->jenis }}
                    @endif
                </td>
                <td>Rp {{ number_format($t->nominal, 0, ',', '.') }}</td>
                <td>Rp {{ number_format($t->saldo_kas_setelah, 0, ',', '.') }}</td>
                <td>Rp {{ number_format($t->saldo_digital_setelah, 0, ',', '.') }}</td>
                <td>{{ $t->keterangan ?? '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total">
        Total Transaksi: {{ $transactions->count() }} transaksi
    </div>

    <div class="footer">
        Dicetak pada: {{ now()->format('d/m/Y H:i:s') }}
    </div>
</body>
</html>