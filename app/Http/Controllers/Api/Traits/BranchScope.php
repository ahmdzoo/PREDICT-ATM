<?php

namespace App\Http\Controllers\Api\Traits;

use App\Models\Branch;
use Illuminate\Http\Request;

trait BranchScope
{
    protected function getBranchId(Request $request): ?int
    {
        $user = $request->user();

        if (!$user->isOwner()) {
            return (int) $user->branch_id;
        }

        $requestBranchId = $request->query('branch_id');
        if ($requestBranchId) {
            return (int) $requestBranchId;
        }

        if ($request->input('branch_id')) {
            return (int) $request->input('branch_id');
        }

        return null;
    }

    protected function applyBranchScope($query, Request $request)
    {
        $user = $request->user();
        $branchId = $this->getBranchId($request);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        } elseif ($user->isOwner()) {
            $branchIds = Branch::where('owner_id', $user->id)->pluck('id');
            $query->whereIn('branch_id', $branchIds);
        }

        return $query;
    }
}
