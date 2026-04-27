<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $today = Carbon::today();
        $user = $request->user();
        
        $query = Appointment::query();
        // Since roles are merged, doctors see everything just like admins
        // But if they are only "doctor", we could still filter if you want, 
        // but the user said "combine privileges", so we show everything.

        $stats = [
            'total_today' => (clone $query)->whereDate('appointment_date', $today)->count(),
            'pending' => (clone $query)->where('status', 'Pending')->count(),
            'confirmed' => (clone $query)->where('status', 'Confirmed')->whereDate('appointment_date', '>=', $today)->count(),
            'cancelled' => (clone $query)->where('status', 'Cancelled')->count(),
            'total_patients' => User::where('role', 'patient')->count(),
            'active_doctors' => User::where('role', 'doctor')->count(),
            'today_appointments' => $query->with(['patient', 'doctor', 'service'])
                ->whereDate('appointment_date', $today)
                ->orderBy('appointment_time', 'asc')
                ->take(5)
                ->get(),
        ];

        return response()->json($stats);
    }
}
