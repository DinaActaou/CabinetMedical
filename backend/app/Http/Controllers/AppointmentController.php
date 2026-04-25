<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Mail\AppointmentConfirmation;
use App\Notifications\NewAppointmentNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Appointment::with(['patient', 'doctor', 'service']);

        // Filter by role: Patients only see their own appointments
        if ($user->role === 'patient') {
            $query->where('patient_id', $user->id);
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function($q) use ($search) {
                $q->whereHas('patient', function($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('doctor', function($dq) use ($search) {
                    $dq->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('service', function($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%");
                });
            });
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
            'status' => 'nullable|string'
        ]);

        $appointment = Appointment::create($validated);

        // 1. Load relationships
        $appointment->load('patient', 'doctor', 'service');

        // 2. Send confirmation email to patient
        Mail::to($appointment->patient->email)
            ->send(new AppointmentConfirmation($appointment));

        // 3. Notify admin via database notification
        $admin = User::admin()->first();
        if ($admin) {
            $admin->notify(new NewAppointmentNotification($appointment));
        }

        // 4. Redirect with success flash
        return redirect()->route('appointments.index')
            ->with('success', __('messages.appointment_created'));
    }

    public function show(Appointment $appointment)
    {
        return response()->json($appointment->load(['patient', 'doctor', 'service']));
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|exists:users,id',
            'doctor_id' => 'nullable|exists:users,id',
            'service_id' => 'nullable|exists:services,id',
            'appointment_date' => 'nullable|date',
            'appointment_time' => 'nullable',
            'notes' => 'nullable|string',
            'status' => 'nullable|string'
        ]);

        $oldStatus = $appointment->status;
        $appointment->update($validated);

        // If status was changed to Confirmed, send email
        if ($oldStatus !== 'Confirmed' && $appointment->status === 'Confirmed') {
            $appointment->load(['patient', 'doctor', 'service']);
            Mail::to($appointment->patient->email)
                ->send(new AppointmentConfirmation($appointment));
        }

        return response()->json($appointment->load(['patient', 'doctor', 'service']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(null, 204);
    }
}
