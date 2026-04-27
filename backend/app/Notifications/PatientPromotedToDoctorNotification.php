<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PatientPromotedToDoctorNotification extends Notification
{
    use Queueable;

    public function __construct(public User $user) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'admin_patient_promoted_doctor',
            'title' => __('Doctor role assigned'),
            'message' => __(':name was granted the doctor role and can now receive appointments.', [
                'name' => $this->user->name,
            ]),
            'user_id' => $this->user->id,
        ];
    }
}
