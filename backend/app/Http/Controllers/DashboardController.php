<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats()
    {
        $today = Carbon::today();
        
        $stats = [
            'total_today' => Appointment::whereDate('appointment_date', $today)->count(),
            'pending' => Appointment::where('status', 'Pending')->count(),
            'confirmed' => Appointment::where('status', 'Confirmed')->count(),
            'cancelled' => Appointment::where('status', 'Cancelled')->count(),
            'total_patients' => User::where('role', 'patient')->count(),
            'active_doctors' => User::where('role', 'doctor')->count(),
            'today_appointments' => Appointment::with(['patient', 'doctor', 'service'])
                ->whereDate('appointment_date', $today)
                ->orderBy('appointment_time', 'asc')
                ->take(5)
                ->get(),
        ];

        return response()->json($stats);
    }
}
