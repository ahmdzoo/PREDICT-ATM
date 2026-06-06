<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Balance;
use App\Models\Branch;
use App\Models\MasterBank;
use Illuminate\Http\Request;

class MasterBankController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isOwner()) {
            $banks = MasterBank::orderBy('tipe')->orderBy('nama')->get();
        } else {
            $banks = MasterBank::where('is_active', true)->orderBy('tipe')->orderBy('nama')->get();
        }

        return response()->json([
            'success' => true,
            'data' => $banks,
        ]);
    }

    public function show(Request $request, $id)
    {
        $bank = MasterBank::findOrFail($id);

        if (!$request->user()->isOwner() && !$bank->is_active) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $bank,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'kode' => 'required|string|max:50|unique:master_banks,kode',
            'tipe' => 'required|in:kas,e-wallet,bank',
            'saldo_awal' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string|max:500',
            'terapkan_ke_semua' => 'boolean',
        ]);

        $bank = MasterBank::create([
            'nama' => $validated['nama'],
            'kode' => $validated['kode'],
            'tipe' => $validated['tipe'],
            'saldo_awal' => $validated['saldo_awal'],
            'keterangan' => $validated['keterangan'] ?? null,
            'is_active' => true,
        ]);

        $terapkanKeSemua = $request->boolean('terapkan_ke_semua', false);

        $branches = Branch::all();
        foreach ($branches as $branch) {
            $existing = Balance::where('branch_id', $branch->id)->where('bank_id', $bank->id)->first();
            if ($existing && $terapkanKeSemua) {
                $existing->update(['saldo' => $bank->saldo_awal]);
            } elseif (!$existing) {
                Balance::create([
                    'branch_id' => $branch->id,
                    'source' => $bank->kode,
                    'bank_id' => $bank->id,
                    'saldo' => $bank->saldo_awal,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Master bank berhasil ditambahkan',
            'data' => $bank,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $bank = MasterBank::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'sometimes|string|max:100',
            'kode' => 'sometimes|string|max:50|unique:master_banks,kode,' . $id,
            'tipe' => 'sometimes|in:kas,e-wallet,bank',
            'saldo_awal' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $bank->update($validated);

        // Update saldo_awal di branch balances jika diminta
        if ($request->has('terapkan_ke_semua') && $request->boolean('terapkan_ke_semua')) {
            Balance::where('bank_id', $bank->id)->update(['saldo' => $bank->saldo_awal]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Master bank berhasil diperbarui',
            'data' => $bank->fresh(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $bank = MasterBank::findOrFail($id);

        if ($bank->tipe === 'kas') {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus sumber kas utama',
            ], 422);
        }

        // Soft-deactivate instead of hard delete
        $bank->update(['is_active' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Master bank berhasil dinonaktifkan',
        ]);
    }
}
