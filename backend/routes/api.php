<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard/stats', [\App\Http\Controllers\DashboardController::class, 'stats']);
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/services', [ServiceController::class, 'index']);
    
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/doctors', [UserController::class, 'doctors']);
    Route::get('/users/patients', [UserController::class, 'patients']);

    Route::apiResource('appointments', AppointmentController::class);
});
