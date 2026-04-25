<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['patient', 'doctor', 'service']);

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

        return response()->json($appointment->load(['patient', 'doctor', 'service']), 201);
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

        $appointment->update($validated);

        return response()->json($appointment->load(['patient', 'doctor', 'service']));
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->json(null, 204);
    }
}
