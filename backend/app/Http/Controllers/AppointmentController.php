<?php

namespace App\Http\Controllers;

use App\Mail\AppointmentConfirmation;
use App\Models\Appointment;
use App\Models\User;
use App\Notifications\DoctorAppointmentAlertNotification;
use App\Notifications\DoctorNewBookingNotification;
use App\Notifications\NewAppointmentNotification;
use App\Services\AdminNotifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Throwable;

class AppointmentController extends Controller
{
    public function availability(Request $request)
    {
        $validated = $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date',
        ]);

        $doctor = User::where('id', $validated['doctor_id'])->where('role', 'doctor')->where('status', 'approved')->first();
        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor_id' => [__('Invalid doctor.')],
            ]);
        }

        $bookedTimes = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('status', '!=', 'Cancelled')
            ->orderBy('appointment_time')
            ->pluck('appointment_time')
            ->map(fn ($time) => substr((string) $time, 0, 5))
            ->values();

        return response()->json([
            'booked_times' => $bookedTimes,
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Appointment::with(['patient', 'doctor', 'service']);

        if ($user) {
            if ($user->role === 'patient') {
                $query->where('patient_id', $user->id);
            } elseif ($user->role === 'doctor') {
                $query->where('doctor_id', $user->id);
            }
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->query('search'));
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('patient', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    })
                        ->orWhereHas('doctor', function ($dq) use ($search) {
                            $dq->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('service', function ($sq) use ($search) {
                            $sq->where('name', 'like', "%{$search}%");
                        });
                });
            }
        }

        return response()->json(
            $query->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:users,id',
            'doctor_id' => 'required|exists:users,id',
            'service_id' => 'required|exists:services,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $user = $request->user();

        if ($user && $user->role === 'doctor') {
            if (! $request->expectsJson()) {
                return redirect()->back()->withErrors(['appointment' => __('Forbidden')]);
            }

            return response()->json(['message' => __('Forbidden')], 403);
        }

        if ($user) {
            if ($user->role === 'patient') {
                if ((int) $validated['patient_id'] !== (int) $user->id) {
                    return response()->json(['message' => __('Forbidden')], 403);
                }
            } elseif ($user->role !== 'admin') {
                return response()->json(['message' => __('Forbidden')], 403);
            }
        }

        $doctor = User::where('id', $validated['doctor_id'])->where('role', 'doctor')->where('status', 'approved')->first();
        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor_id' => [__('The selected user is not a doctor.')],
            ]);
        }

        $patient = User::where('id', $validated['patient_id'])->where('role', 'patient')->first();
        if (! $patient) {
            throw ValidationException::withMessages([
                'patient_id' => [__('The selected user is not a patient.')],
            ]);
        }

        $hasConflict = Appointment::where('doctor_id', $validated['doctor_id'])
            ->whereDate('appointment_date', $validated['appointment_date'])
            ->where('appointment_time', $validated['appointment_time'])
            ->where('status', '!=', 'Cancelled')
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'appointment_time' => __('This doctor already has an appointment at this date and time.'),
            ]);
        }

        $appointment = Appointment::create($validated);

        $appointment->load('patient', 'doctor', 'service');

        try {
            Mail::to($appointment->patient->email)
                ->send(new AppointmentConfirmation($appointment));
        } catch (Throwable $e) {
            Log::warning('Appointment confirmation email failed', ['exception' => $e->getMessage()]);
        }

        try {
            AdminNotifier::notify(new NewAppointmentNotification($appointment));
        } catch (Throwable $e) {
            Log::warning('Admin appointment notification failed', ['exception' => $e->getMessage()]);
        }

        try {
            $doctor = $appointment->doctor;
            if ($doctor) {
                $doctor->notify(new DoctorNewBookingNotification($appointment));
            }
        } catch (Throwable $e) {
            Log::warning('Doctor new booking notification failed', ['exception' => $e->getMessage()]);
        }

        if (! $request->expectsJson()) {
            return redirect('/')->with('success', __('Appointment saved successfully'));
        }

        return response()->json($appointment, 201);
    }

    public function show(Request $request, Appointment $appointment)
    {
        $this->authorizeAppointmentAccess($request->user(), $appointment);

        return response()->json($appointment->load(['patient', 'doctor', 'service']));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $user = $request->user();
        $this->authorizeAppointmentAccess($user, $appointment);

        if ($user->role === 'patient') {
            $validated = $request->validate([
                'status' => 'required|string|in:Cancelled',
            ]);
            $beforeStatus = $appointment->status;
            $appointment->update($validated);
            $appointment->refresh()->load(['patient', 'doctor', 'service']);
            $this->notifyDoctorOfAppointmentChange($user, $appointment, $beforeStatus);

            if (! $request->expectsJson()) {
                return redirect('/')->with('success', __('Appointment saved successfully'));
            }

            return response()->json($appointment->load(['patient', 'doctor', 'service']));
        }

        $validated = $request->validate([
            'patient_id' => 'nullable|exists:users,id',
            'doctor_id' => 'nullable|exists:users,id',
            'service_id' => 'nullable|exists:services,id',
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable',
            'notes' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($user->role === 'doctor') {
            $validated['doctor_id'] = $user->id;
        }

        if (isset($validated['doctor_id'])) {
            $doc = User::where('id', $validated['doctor_id'])->where('role', 'doctor')->where('status', 'approved')->first();
            if (! $doc) {
                throw ValidationException::withMessages([
                    'doctor_id' => [__('The selected user is not a doctor.')],
                ]);
            }
        }

        if (isset($validated['patient_id'])) {
            $pat = User::where('id', $validated['patient_id'])->where('role', 'patient')->first();
            if (! $pat) {
                throw ValidationException::withMessages([
                    'patient_id' => [__('The selected user is not a patient.')],
                ]);
            }
        }

        $doctorId = $validated['doctor_id'] ?? $appointment->doctor_id;
        $date = $validated['appointment_date'] ?? $appointment->appointment_date;
        $time = $validated['appointment_time'] ?? $appointment->appointment_time;
        $status = $validated['status'] ?? $appointment->status;

        if (! $this->isAppointmentCancelled($status)) {
            $hasConflict = Appointment::where('doctor_id', $doctorId)
                ->whereDate('appointment_date', $date)
                ->where('appointment_time', $time)
                ->where('status', '!=', 'Cancelled')
                ->where('id', '!=', $appointment->id)
                ->exists();

            if ($hasConflict) {
                throw ValidationException::withMessages([
                    'appointment_time' => __('This doctor already has an appointment at this date and time.'),
                ]);
            }
        }

        $oldStatus = $appointment->status;
        $appointment->update($validated);
        $appointment->refresh()->load(['patient', 'doctor', 'service']);
        $this->notifyDoctorOfAppointmentChange($user, $appointment, $oldStatus);

        if ($oldStatus !== 'Confirmed' && $appointment->status === 'Confirmed') {
            $appointment->load(['patient', 'doctor', 'service']);
            Mail::to($appointment->patient->email)
                ->send(new AppointmentConfirmation($appointment));
        }

        if (! $request->expectsJson()) {
            return redirect('/')->with('success', __('Appointment saved successfully'));
        }

        return response()->json($appointment->load(['patient', 'doctor', 'service']));
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        $this->authorizeAppointmentAccess($request->user(), $appointment);

        $appointment->load(['patient', 'doctor', 'service']);
        $actor = $request->user();
        $doctor = $appointment->doctor;
        if ($doctor && (int) $actor->id !== (int) $doctor->id) {
            try {
                $doctor->notify(DoctorAppointmentAlertNotification::fromAppointment($appointment, 'deleted'));
            } catch (Throwable $e) {
                Log::warning('Doctor appointment deleted notification failed', ['exception' => $e->getMessage()]);
            }
        }

        $appointment->delete();

        if (! $request->expectsJson()) {
            return redirect('/')->with('success', __('Appointment deleted'));
        }

        return response()->json(null, 204);
    }

    private function authorizeAppointmentAccess(User $user, Appointment $appointment): void
    {
        if ($user->role === 'admin') {
            return;
        }

        if ($user->role === 'patient' && (int) $appointment->patient_id === (int) $user->id) {
            return;
        }

        if ($user->role === 'doctor' && (int) $appointment->doctor_id === (int) $user->id) {
            return;
        }

        abort(403, __('Forbidden'));
    }

    /**
     * Notify the assigned doctor when someone else changes the appointment (cancel, reschedule, etc.).
     */
    private function notifyDoctorOfAppointmentChange(User $actor, Appointment $appointment, string $previousStatus): void
    {
        $doctor = $appointment->doctor;
        if (! $doctor || (int) $actor->id === (int) $doctor->id) {
            return;
        }

        try {
            if ($this->isAppointmentCancelled($appointment->status) && ! $this->isAppointmentCancelled($previousStatus)) {
                $doctor->notify(DoctorAppointmentAlertNotification::fromAppointment($appointment, 'cancelled'));
            } else {
                $doctor->notify(DoctorAppointmentAlertNotification::fromAppointment($appointment, 'updated'));
            }
        } catch (Throwable $e) {
            Log::warning('Doctor appointment change notification failed', ['exception' => $e->getMessage()]);
        }
    }

    private function isAppointmentCancelled(?string $status): bool
    {
        return $status !== null && strcasecmp(trim($status), 'cancelled') === 0;
    }
}
