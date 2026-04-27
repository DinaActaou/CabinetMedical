<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Contracts\View\View;

class AdminUserManagementController extends Controller
{
    public function index(): View
    {
        $users = User::orderBy('name')->get(['id', 'name', 'email', 'role', 'status', 'created_at']);

        return view('admin.users', compact('users'));
    }
}
