<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $today = Carbon::today();
        $user = $request->user();

        if ($user->role === 'admin') {
            return response()->json($this->adminStats($today));
        }

        if ($user->role === 'doctor') {
            return response()->json($this->doctorStats($user, $today));
        }

        return response()->json(['message' => __('Forbidden')], 403);
    }

    private function adminStats(Carbon $today): array
    {
        $query = Appointment::query();

        return [
            'total_today' => (clone $query)->whereDate('appointment_date', $today)->count(),
            'pending' => (clone $query)->where('status', 'Pending')->count(),
            'confirmed' => (clone $query)->where('status', 'Confirmed')->whereDate('appointment_date', '>=', $today)->count(),
            'cancelled' => (clone $query)->where('status', 'Cancelled')->count(),
            'total_patients' => User::where('role', 'patient')->count(),
            'active_doctors' => User::where('role', 'doctor')->count(),
            'today_appointments' => Appointment::with(['patient', 'doctor', 'service'])
                ->whereDate('appointment_date', $today)
                ->orderBy('appointment_time', 'asc')
                ->take(5)
                ->get(),
        ];
    }

    private function doctorStats(User $user, Carbon $today): array
    {
        $base = Appointment::where('doctor_id', $user->id);

        $patientCount = (clone $base)->distinct('patient_id')->count('patient_id');

        return [
            'total_today' => (clone $base)->whereDate('appointment_date', $today)->count(),
            'pending' => (clone $base)->where('status', 'Pending')->count(),
            'confirmed' => (clone $base)->where('status', 'Confirmed')->whereDate('appointment_date', '>=', $today)->count(),
            'cancelled' => (clone $base)->where('status', 'Cancelled')->count(),
            'total_patients' => $patientCount,
            'active_doctors' => 1,
            'today_appointments' => Appointment::with(['patient', 'doctor', 'service'])
                ->where('doctor_id', $user->id)
                ->whereDate('appointment_date', $today)
                ->orderBy('appointment_time', 'asc')
                ->take(5)
                ->get(),
        ];
    }
}
