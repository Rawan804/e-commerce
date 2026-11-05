<?php

namespace App\Modules\Products\Policies;

use App\Modules\Products\Models\Product;
use App\Modules\Users\Models\User;

class ProductPolicy
{
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Product $product): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->isAdmin();
    }
}