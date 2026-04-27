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
            'patient_id' => fn () => User::query()
                ->where('role', 'patient')
                ->inRandomOrder()
                ->value('id')
                ?? User::factory()->demoPatient()->create()->id,
            'doctor_id' => fn () => User::query()
                ->where('role', 'doctor')
                ->where('status', 'approved')
                ->inRandomOrder()
                ->value('id')
                ?? User::factory()->create([
                    'role' => 'doctor',
                    'status' => 'approved',
                ])->id,
            'service_id' => fn () => Service::query()->inRandomOrder()->value('id')
                ?? Service::factory()->create()->id,
            'appointment_date' => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'appointment_time' => sprintf('%02d:%02d:00', random_int(8, 16), random_int(0, 59)),
            'status' => fake()->randomElement(['pending', 'confirmed', 'cancelled']),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
