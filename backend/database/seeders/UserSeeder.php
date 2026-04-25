<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
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
            ['name' => 'Dr. Karim Benali', 'email' => 'doctor@medibook.com'], // Using the specific email here
            ['name' => 'Dr. Sara Moussaoui', 'email' => 'sara@example.com'],
            ['name' => 'Dr. Hassan Idrissi', 'email' => 'hassan@example.com'],
            ['name' => 'Dr. Leila Fassi', 'email' => 'leila@example.com'],
            ['name' => 'Dr. Mehdi Squalli', 'email' => 'mehdi@example.com'],
        ];

        // Seed 5 Patients
        foreach ($patients as $data) {
            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'patient',
                'email_verified_at' => now(),
            ]);
        }

        // Seed 5 Doctors
        foreach ($doctors as $data) {
            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'email_verified_at' => now(),
            ]);
        }

        // Seed 1 Admin
        User::create([
            'name' => 'Administrateur MediBook',
            'email' => 'admin@medibook.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }
}
