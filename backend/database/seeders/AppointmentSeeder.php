<?php

namespace Database\Seeders;

use App\Models\Appointment;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Au moins 20 rendez-vous pour démonstration immédiate
        Appointment::factory()->count(20)->create();
    }
}
