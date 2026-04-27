<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Informs the doctor when an appointment involving them is changed or removed.
 *
 * @param  string  $kind  cancelled|updated|deleted
 */
class DoctorAppointmentAlertNotification extends Notification
{
    use Queueable;

    public function __construct(
        public string $kind,
        public ?int $appointmentId = null,
        public ?string $patientName = null,
        public ?string $serviceName = null,
        public ?string $date = null,
        public ?string $time = null,
    ) {}

    public static function fromAppointment(Appointment $appointment, string $kind): self
    {
        $appointment->loadMissing(['patient', 'service']);

        return new self(
            $kind,
            $appointment->id,
            $appointment->patient?->name,
            $appointment->service?->name,
            (string) $appointment->appointment_date,
            substr((string) $appointment->appointment_time, 0, 5),
        );
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $patient = $this->patientName ?? __('Unknown');

        $message = match ($this->kind) {
            'cancelled' => __(':patient cancelled the :service appointment on :date at :time.', [
                'patient' => $patient,
                'service' => $this->serviceName ?? __('Unknown'),
                'date' => $this->date ?? '',
                'time' => $this->time ?? '',
            ]),
            'deleted' => __('An appointment with :patient (:service) was removed from your schedule.', [
                'patient' => $patient,
                'service' => $this->serviceName ?? __('Unknown'),
            ]),
            default => __('The appointment with :patient (:service) on :date at :time was updated.', [
                'patient' => $patient,
                'service' => $this->serviceName ?? __('Unknown'),
                'date' => $this->date ?? '',
                'time' => $this->time ?? '',
            ]),
        };

        return [
            'type' => 'doctor_appointment_'.$this->kind,
            'title' => match ($this->kind) {
                'cancelled' => __('Appointment cancelled'),
                'deleted' => __('Appointment removed'),
                default => __('Appointment updated'),
            },
            'message' => $message,
            'appointment_id' => $this->appointmentId,
            'kind' => $this->kind,
        ];
    }
}
