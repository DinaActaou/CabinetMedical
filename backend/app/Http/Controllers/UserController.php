<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\Specialization;
use App\Models\User;
use App\Notifications\PatientPromotedToDoctorNotification;
use App\Services\AdminNotifier;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::orderBy('name')->get());
    }

    public function doctors(Request $request)
    {
        $query = User::query()
            ->where('role', 'doctor')
            ->where('status', 'approved')
            ->with('specialization');

        if ($request->filled('service_id')) {
            $service = Service::query()->find($request->integer('service_id'));
            if ($service && $service->specialization_id) {
                $query->where('specialization_id', $service->specialization_id);
            } else {
                $doctorIds = Appointment::where('service_id', $request->integer('service_id'))
                    ->select('doctor_id')
                    ->distinct()
                    ->pluck('doctor_id');

                if ($doctorIds->isEmpty()) {
                    $query->whereRaw('1 = 0');
                } else {
                    $query->whereIn('id', $doctorIds);
                }
            }
        }

        if ($request->filled('specialization_id')) {
            $query->where('specialization_id', $request->query('specialization_id'));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function patients(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'doctor') {
            $patientIds = Appointment::where('doctor_id', $user->id)
                ->distinct()
                ->pluck('patient_id');

            return response()->json(
                User::where('role', 'patient')
                    ->whereIn('id', $patientIds)
                    ->orderBy('name')
                    ->get()
            );
        }

        return response()->json(
            User::where('role', 'patient')->orderBy('name')->get()
        );
    }

    public function updateDoctorSpecialization(Request $request, User $user)
    {
        if ($user->role !== 'doctor' || $user->status !== 'approved') {
            if (! $request->expectsJson()) {
                return redirect('/')->withErrors(['user' => __('Only approved doctors can be assigned a specialization.')]);
            }

            return response()->json(['message' => __('Only approved doctors can be assigned a specialization.')], 422);
        }

        $validated = $request->validate([
            'specialization_id' => 'required|exists:specializations,id',
        ]);

        $spec = Specialization::findOrFail($validated['specialization_id']);
        $user->update([
            'specialization_id' => $spec->id,
            'specialty' => $spec->name,
        ]);

        if (! $request->expectsJson()) {
            return redirect('/')->with('success', __('Specialization updated.'));
        }

        return response()->json($user->load('specialization'));
    }

    public function updateRole(Request $request, User $user)
    {
        if ($user->role === 'admin') {
            if (! $request->expectsJson()) {
                return redirect('/')->withErrors(['role' => __('Administrator accounts cannot be changed from this panel.')]);
            }

            return response()->json(['message' => __('Administrator accounts cannot be changed from this panel.')], 403);
        }

        $validated = $request->validate([
            'role' => 'required|in:patient,doctor',
            'specialization_id' => 'nullable|exists:specializations,id',
        ]);

        if ($validated['role'] === 'doctor' && $user->role !== 'patient') {
            if (! $request->expectsJson()) {
                return redirect('/')->withErrors(['role' => __('Only patients can be promoted to doctor.')]);
            }

            return response()->json(['message' => __('Only patients can be promoted to doctor.')], 422);
        }

        if ($validated['role'] === 'patient' && $user->role !== 'doctor') {
            if (! $request->expectsJson()) {
                return redirect('/')->withErrors(['role' => __('Only doctors can be reassigned to patient.')]);
            }

            return response()->json(['message' => __('Only doctors can be reassigned to patient.')], 422);
        }

        $targetRole = $validated['role'];
        $targetStatus = $targetRole === 'doctor' ? 'approved' : 'pending';

        $updates = [
            'role' => $targetRole,
            'status' => $targetStatus,
        ];

        if ($targetRole === 'doctor') {
            $spec = $this->resolvePromotionSpecialization($validated['specialization_id'] ?? null);
            if (! $spec) {
                $message = __('No specialization configured. Add one in the admin panel first.');
                if (! $request->expectsJson()) {
                    return redirect('/')->withErrors(['role' => $message]);
                }

                return response()->json(['message' => $message], 422);
            }
            $updates['specialization_id'] = $spec->id;
            $updates['specialty'] = $spec->name;
        } else {
            $updates['specialization_id'] = null;
            $updates['specialty'] = null;
        }

        $user->update($updates);

        if ($targetRole === 'doctor') {
            AdminNotifier::notify(new PatientPromotedToDoctorNotification($user->fresh()));
        }

        if (! $request->expectsJson()) {
            return redirect('/')->with('success', __('User role updated successfully'));
        }

        return response()->json($user->load('specialization'));
    }

    private function resolvePromotionSpecialization(mixed $specializationId): ?Specialization
    {
        if ($specializationId !== null && $specializationId !== '') {
            $chosen = Specialization::find($specializationId);
            if ($chosen) {
                return $chosen;
            }
        }

        return Specialization::where('name', 'General Medicine')->first()
            ?? Specialization::query()->orderBy('name')->first();
    }
}
