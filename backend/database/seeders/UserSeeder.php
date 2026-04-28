<?php

namespace Database\Seeders;

use App\Models\Specialization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $patients = [
            ['name' => 'Ahmed Benjelloun', 'email' => 'patient@medibook.com'], // Using the specific email here
            ['name' => 'Fatima Ezzahra', 'email' => 'fatima@example.com'],
            ['name' => 'Youssef Alami', 'email' => 'youssef@example.com'],
            ['name' => 'Nadia Tazi', 'email' => 'nadia@example.com'],
            ['name' => 'Omar Chraibi', 'email' => 'omar@example.com'],
        ];

        $doctors = [
            ['name' => 'Dr. Karim Benali', 'email' => 'doctor@medibook.com', 'specialty' => 'Cardiology'],
            ['name' => 'Dr. Sara Moussaoui', 'email' => 'sara@example.com', 'specialty' => 'Pediatrics'],
            ['name' => 'Dr. Hassan Idrissi', 'email' => 'hassan@example.com', 'specialty' => 'Dermatology'],
            ['name' => 'Dr. Leila Fassi', 'email' => 'leila@example.com', 'specialty' => 'General Medicine'],
            ['name' => 'Dr. Mehdi Squalli', 'email' => 'mehdi@example.com', 'specialty' => 'Neurology'],
        ];

        foreach ($patients as $data) {
            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'patient',
                'status' => 'pending',
                'email_verified_at' => now(),
            ]);
        }

        // Seed 5 Doctors
        foreach ($doctors as $data) {
            $spec = Specialization::where('name', $data['specialty'])->first();
            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'status' => 'approved',
                'specialty' => $data['specialty'],
                'specialization_id' => $spec?->id,
                'email_verified_at' => now(),
            ]);
        }
        User::create([
            'name' => 'Administrateur MediBook',
            'email' => 'admin@medibook.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'approved',
            'email_verified_at' => now(),
        ]);

        User::factory()
            ->count(5)
            ->demoPatient()
            ->create();
    }
}
