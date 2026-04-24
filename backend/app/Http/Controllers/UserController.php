<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function doctors()
    {
        return response()->json(User::where('role', 'doctor')->get());
    }

    public function patients()
    {
        return response()->json(User::where('role', 'patient')->get());
    }
}
