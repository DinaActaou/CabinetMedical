<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class AdminNotifier
{
    /**
     * Send a database notification to every approved administrator.
     */
    public static function notify(Notification $notification): void
    {
        foreach (User::query()->where('role', 'admin')->where('status', 'approved')->cursor() as $admin) {
            try {
                $admin->notify($notification);
            } catch (Throwable $e) {
                Log::warning('Failed to notify admin', [
                    'admin_id' => $admin->id,
                    'exception' => $e->getMessage(),
                ]);
            }
        }
    }
}
