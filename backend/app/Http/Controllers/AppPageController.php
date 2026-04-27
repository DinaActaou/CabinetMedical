<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\Specialization;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\View\View;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class AppPageController extends Controller
{
    public function __invoke(Request $request): View
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing('specialization');
        }

        if (! $this->hasRequiredTables()) {
            return view('app', ['initialData' => ['user' => $user]]);
        }

        try {
            $initialData = [
                'services' => Service::orderBy('name')->get(),
                'doctors' => User::query()
                    ->where('role', 'doctor')
                    ->where('status', 'approved')
                    ->with('specialization')
                    ->orderBy('name')
                    ->get(),
                'specializations' => Specialization::orderBy('name')->get(),
                'user' => $user,
            ];

            if (! $user) {
                return view('app', ['initialData' => $initialData]);
            }

            $appointmentsQuery = Appointment::with(['patient', 'doctor', 'service']);
            if ($user->role === 'patient') {
                $appointmentsQuery->where('patient_id', $user->id);
            } elseif ($user->role === 'doctor') {
                $appointmentsQuery->where('doctor_id', $user->id);
            }

            $appointments = $appointmentsQuery
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->get();

            $initialData['appointments'] = $appointments;

            if ($user->role === 'doctor') {
                $patientIds = Appointment::where('doctor_id', $user->id)->distinct()->pluck('patient_id');
                $initialData['doctorPatients'] = User::where('role', 'patient')->whereIn('id', $patientIds)->orderBy('name')->get();
                $initialData['dashboardStats'] = $this->doctorStats($user);
                $initialData['modalPatients'] = User::where('role', 'patient')->whereIn('id', $patientIds)->orderBy('name')->get();
            } elseif ($user->role === 'admin') {
                $initialData['adminDoctors'] = User::query()
                    ->where('role', 'doctor')
                    ->where('status', 'approved')
                    ->with('specialization')
                    ->orderBy('name')
                    ->get();
                $initialData['adminPatients'] = User::where('role', 'patient')->orderBy('name')->get();
                $initialData['dashboardStats'] = $this->adminStats();
                $initialData['modalPatients'] = $initialData['adminPatients'];
            } elseif ($user->role === 'patient') {
                $initialData['modalPatients'] = collect([$user]);
            }

            if (! isset($initialData['modalPatients'])) {
                $initialData['modalPatients'] = User::where('role', 'patient')->orderBy('name')->get();
            }
        } catch (QueryException) {
            $initialData = ['user' => $user];
        }

        return view('app', ['initialData' => $initialData]);
    }

    private function hasRequiredTables(): bool
    {
        return Schema::hasTable('users')
            && Schema::hasTable('appointments')
            && Schema::hasTable('services')
            && Schema::hasTable('specializations');
    }

    private function adminStats(): array
    {
        $today = Carbon::today();
        $query = Appointment::query();

        return [
            'total_today' => (clone $query)->whereDate('appointment_date', $today)->count(),
            'pending' => (clone $query)->where('status', 'Pending')->count(),
            'confirmed' => (clone $query)->where('status', 'Confirmed')->whereDate('appointment_date', '>=', $today)->count(),
            'cancelled' => (clone $query)->where('status', 'Cancelled')->count(),
            'total_patients' => User::where('role', 'patient')->count(),
            'today_appointments' => Appointment::with(['patient', 'doctor', 'service'])
                ->whereDate('appointment_date', $today)
                ->orderBy('appointment_time', 'asc')
                ->take(5)
                ->get(),
        ];
    }

    private function doctorStats(User $user): array
    {
        $today = Carbon::today();
        $base = Appointment::where('doctor_id', $user->id);

        return [
            'total_today' => (clone $base)->whereDate('appointment_date', $today)->count(),
            'pending' => (clone $base)->where('status', 'Pending')->count(),
            'confirmed' => (clone $base)->where('status', 'Confirmed')->whereDate('appointment_date', '>=', $today)->count(),
            'cancelled' => (clone $base)->where('status', 'Cancelled')->count(),
            'total_patients' => (clone $base)->distinct('patient_id')->count('patient_id'),
            'today_appointments' => Appointment::with(['patient', 'doctor', 'service'])
                ->where('doctor_id', $user->id)
                ->whereDate('appointment_date', $today)
                ->orderBy('appointment_time', 'asc')
                ->take(5)
                ->get(),
        ];
    }
}
