<?php

use App\Http\Controllers\AdminSpecializationController;
use App\Http\Controllers\AdminUserManagementController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AppPageController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', AppPageController::class);

Route::post('/login', [AuthController::class, 'login'])->name('web.login');
Route::post('/register', [AuthController::class, 'register'])->name('web.register');
Route::post('/logout', [AuthController::class, 'logout'])->name('web.logout');

Route::middleware('auth')->group(function () {
    /* JSON pour le SPA (session web) — évite les 401 Sanctum/API sans cookie de session */
    Route::get('/web-api/users/doctors', [UserController::class, 'doctors'])
        ->middleware('role:patient,doctor,admin')
        ->name('web.data.users.doctors');
    Route::get('/web-api/appointments/availability', [AppointmentController::class, 'availability'])
        ->middleware('role:patient')
        ->name('web.data.appointments.availability');
    Route::get('/web-api/appointments', [AppointmentController::class, 'index'])
        ->middleware('role:patient,doctor,admin')
        ->name('web.data.appointments.index');

    Route::post('/appointments', [AppointmentController::class, 'store'])->name('web.appointments.store');
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update'])->name('web.appointments.update');
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy'])->name('web.appointments.destroy');

    Route::put('/users/{user}/role', [UserController::class, 'updateRole'])
        ->middleware('role:admin')
        ->name('web.users.role');

    Route::put('/users/{user}/specialization', [UserController::class, 'updateDoctorSpecialization'])
        ->middleware('role:admin')
        ->name('web.users.specialization');

    Route::get('/admin/users', [AdminUserManagementController::class, 'index'])
        ->middleware('role:admin')
        ->name('admin.users.index');

    Route::get('/admin/specializations', [AdminSpecializationController::class, 'index'])
        ->middleware('role:admin')
        ->name('admin.specializations.index');
    Route::post('/admin/specializations', [AdminSpecializationController::class, 'store'])
        ->middleware('role:admin')
        ->name('admin.specializations.store');
    Route::put('/admin/specializations/{specialization}', [AdminSpecializationController::class, 'update'])
        ->middleware('role:admin')
        ->name('admin.specializations.update');
    Route::delete('/admin/specializations/{specialization}', [AdminSpecializationController::class, 'destroy'])
        ->middleware('role:admin')
        ->name('admin.specializations.destroy');

    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('web.notifications.read-all');

    Route::get('/web-api/notifications', [NotificationController::class, 'index'])
        ->name('web.data.notifications.index');
    Route::post('/web-api/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('web.data.notifications.read-all');
    Route::post('/web-api/notifications/{id}/read', [NotificationController::class, 'markAsRead'])
        ->name('web.data.notifications.read');
});

Route::get('/lang/{locale}', function ($locale) {
    if (in_array($locale, ['en', 'fr'])) {
        session(['locale' => $locale]);
    }

    return redirect()->back();
});
