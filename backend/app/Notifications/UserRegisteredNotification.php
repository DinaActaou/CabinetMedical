<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class UserRegisteredNotification extends Notification
{
    use Queueable;

    public function __construct(public User $registeredUser) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'admin_user_registered',
            'title' => __('New user registration'),
            'message' => __(':name (:email) registered as a patient.', [
                'name' => $this->registeredUser->name,
                'email' => $this->registeredUser->email,
            ]),
            'user_id' => $this->registeredUser->id,
        ];
    }
}
