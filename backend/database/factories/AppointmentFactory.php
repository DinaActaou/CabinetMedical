<?php

namespace Database\Factories;

use App\Models\Appointment;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Appointment>
 */
class AppointmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'patient_id' => User::where('role', 'patient')->inRandomOrder()->first()?->id ?? User::factory()->state(['role' => 'patient']),
            'doctor_id' => User::where('role', 'doctor')->inRandomOrder()->first()?->id ?? User::factory()->state(['role' => 'doctor']),
            'service_id' => Service::inRandomOrder()->first()?->id ?? Service::factory(),
            'appointment_date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'appointment_time' => sprintf('%02d:%02d', rand(8, 16), rand(0, 59)),
            'status' => fake()->randomElement(['pending', 'confirmed', 'cancelled']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
