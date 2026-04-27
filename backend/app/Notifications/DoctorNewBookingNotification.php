<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DoctorNewBookingNotification extends Notification
{
    use Queueable;

    public function __construct(public Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $this->appointment->loadMissing(['patient', 'service']);

        $patient = $this->appointment->patient;
        $service = $this->appointment->service;

        return [
            'type' => 'doctor_new_booking',
            'title' => __('New appointment'),
            'message' => __(':patient booked :service on :date at :time.', [
                'patient' => $patient?->name ?? __('Unknown'),
                'service' => $service?->name ?? __('Unknown'),
                'date' => (string) $this->appointment->appointment_date,
                'time' => substr((string) $this->appointment->appointment_time, 0, 5),
            ]),
            'appointment_id' => $this->appointment->id,
            'patient_name' => $patient?->name,
        ];
    }
}
