<?php

namespace App\Modules\Users\Http\Controllers;

use App\Modules\Shared\Exceptions\ApiException;
use App\Modules\Users\Http\Resources\UserResource;
use App\Modules\Users\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UsersController
{
    /** GET /users  (admin only) */
    public function index(Request $request)
    {
        $this->requireAdmin($request);

        $users = User::query()
            ->when(
                $request->filled('search'),
                fn ($q) => $q->where(function ($q) use ($request) {
                    $term = '%' . addcslashes($request->input('search'), '%_\\') . '%';
                    $q->where('name', 'like', $term)
                      ->orWhere('email', 'like', $term);
                })
            )
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15))
            ->withQueryString();

        return UserResource::collection($users);
    }

    /** DELETE /users/{user}  (admin only, cannot delete self) */
    public function destroy(Request $request, User $user): Response
    {
        $this->requireAdmin($request);

        if ((int) $request->user()->id === (int) $user->id) {
            throw new ApiException(422, 'CANNOT_DELETE_SELF', 'You cannot delete your own account.');
        }

        $user->delete();

        return response()->noContent();
    }

    /** PATCH /users/{user}/role  (admin only) */
    public function updateRole(Request $request, User $user): UserResource
    {
        $this->requireAdmin($request);

        if ((int) $request->user()->id === (int) $user->id) {
            throw new ApiException(422, 'CANNOT_CHANGE_OWN_ROLE', 'You cannot change your own role.');
        }

        $validated = $request->validate([
            'role' => ['required', Rule::in([User::ROLE_ADMIN, User::ROLE_CUSTOMER])],
        ]);

        $user->role = $validated['role'];
        $user->save();

        return new UserResource($user->fresh());
    }

    private function requireAdmin(Request $request): void
    {
        if (! $request->user()?->isAdmin()) {
            throw new ApiException(403, 'FORBIDDEN', 'Admin access required.');
        }
    }
}
