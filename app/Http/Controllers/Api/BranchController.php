<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->isOwner()) {
            $branches = Branch::where('owner_id', $user->id)->orderBy('name')->get();
        } else {
            $branches = Branch::where('id', $user->branch_id)->get();
        }

        return response()->json([
            'success' => true,
            'data' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:branches,code',
            'address' => 'nullable|string|max:500',
        ]);

        $branch = Branch::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'address' => $validated['address'] ?? null,
            'owner_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cabang berhasil dibuat',
            'data' => $branch,
        ]);
    }

    public function show(Request $request, $id)
    {
        $branch = Branch::findOrFail($id);

        if (!$request->user()->isOwner() && $request->user()->branch_id != $id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        if ($request->user()->isOwner() && $branch->owner_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $branch,
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $branch = Branch::where('owner_id', $user->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|max:50|unique:branches,code,' . $id,
            'address' => 'nullable|string|max:500',
        ]);

        $branch->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cabang berhasil diperbarui',
            'data' => $branch,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $branch = Branch::where('owner_id', $user->id)->findOrFail($id);

        if ($branch->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat menghapus cabang yang masih memiliki admin',
            ], 422);
        }

        $branch->transactions()->update(['branch_id' => null]);
        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cabang berhasil dihapus',
        ]);
    }
}
