<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $user->load('branch');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout.',
        ]);
    }

    public function register(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'role' => 'sometimes|in:owner,admin',
        ];

        $authUser = $request->user();
        $isCreatingByOwner = $authUser && $authUser->isOwner();

        if ($isCreatingByOwner) {
            $rules['role'] = 'required|in:admin';
            $rules['branch_id'] = 'required|exists:branches,id';
        } elseif ($request->role === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Registrasi admin hanya dapat dilakukan oleh owner.',
            ], 422);
        }

        $validated = $request->validate($rules);

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'owner',
        ];

        if (isset($validated['branch_id'])) {
            $userData['branch_id'] = $validated['branch_id'];
        }

        $user = User::create($userData);

        if ($user->isOwner()) {
            $branch = Branch::create([
                'name' => 'Cabang Utama',
                'code' => 'UTAMA-' . strtoupper(substr(md5($user->id), 0, 5)),
                'address' => $user->store_address ?? 'Alamat utama',
                'owner_id' => $user->id,
            ]);

            $user->update(['branch_id' => $branch->id]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $user->load('branch');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user()->load('branch');

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'store_name' => 'sometimes|string|max:255',
            'store_address' => 'sometimes|string|max:500',
        ]);

        $user->update($request->only(['name', 'phone', 'store_name', 'store_address']));

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Profil berhasil diperbarui.',
        ]);
    }

    public function registerAdmin(Request $request)
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $branch = Branch::where('owner_id', $user->id)->findOrFail($validated['branch_id']);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'branch_id' => $branch->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin berhasil didaftarkan untuk cabang ' . $branch->name,
            'data' => $admin->load('branch'),
        ]);
    }

    public function listAdmins(Request $request)
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $branchId = $request->query('branch_id');

        $query = User::where('role', 'admin')->whereIn('branch_id', function ($q) use ($user) {
            $q->select('id')->from('branches')->where('owner_id', $user->id);
        });

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $admins = $query->with('branch')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $admins,
        ]);
    }
}
