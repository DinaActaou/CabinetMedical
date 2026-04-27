<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function doctors(Request $request)
    {
        $query = User::where('role', 'doctor');

        if ($request->filled('service_id')) {
            $doctorIds = Appointment::where('service_id', $request->query('service_id'))
                ->select('doctor_id')
                ->distinct()
                ->pluck('doctor_id');

            $query->whereIn('id', $doctorIds);
        }

        return response()->json($query->get());
    }

    public function patients()
    {
        return response()->json(User::where('role', 'patient')->get());
    }

    public function updateRole(Request $request, User $user)
    {
        // Combined privileges: Both admins and doctors can manage roles
        if ($request->user()->role !== 'admin' && $request->user()->role !== 'doctor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:admin,doctor,patient'
        ]);

        // Security: Prevent self-demotion
        if ($request->user()->id === $user->id && $validated['role'] !== $request->user()->role) {
            return response()->json(['message' => 'You cannot demote yourself.'], 400);
        }

        $user->update(['role' => $validated['role']]);

        return response()->json($user);
    }
}
