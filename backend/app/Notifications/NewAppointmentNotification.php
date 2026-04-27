<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewAppointmentNotification extends Notification
{
    use Queueable;

    public function __construct(public Appointment $appointment) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $this->appointment->loadMissing(['patient', 'doctor', 'service']);

        return [
            'type' => 'admin_new_booking',
            'title' => __('New appointment'),
            'message' => __(':patient booked with :doctor — :service on :date at :time.', [
                'patient' => $this->appointment->patient?->name ?? __('Unknown'),
                'doctor' => $this->appointment->doctor?->name ?? __('Unknown'),
                'service' => $this->appointment->service?->name ?? __('Unknown'),
                'date' => (string) $this->appointment->appointment_date,
                'time' => substr((string) $this->appointment->appointment_time, 0, 5),
            ]),
            'appointment_id' => $this->appointment->id,
            'patient_name' => $this->appointment->patient?->name,
            'doctor_name' => $this->appointment->doctor?->name,
            'service_name' => $this->appointment->service?->name,
            'date' => $this->appointment->appointment_date,
            'time' => $this->appointment->appointment_time,
        ];
    }
}
