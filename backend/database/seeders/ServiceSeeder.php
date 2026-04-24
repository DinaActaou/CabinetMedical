<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            ['name' => 'Consultation Générale', 'duration' => 30, 'price' => 150, 'description' => 'Consultation médicale générale.'],
            ['name' => 'Cardiologie', 'duration' => 45, 'price' => 350, 'description' => 'Examen cardiologique complet.'],
            ['name' => 'Pédiatrie', 'duration' => 30, 'price' => 200, 'description' => 'Soins spécialisés pour enfants.'],
            ['name' => 'Dentisterie', 'duration' => 60, 'price' => 400, 'description' => 'Soins dentaires et bucco-dentaires.'],
            ['name' => 'Dermatologie', 'duration' => 30, 'price' => 250, 'description' => 'Traitement des maladies de la peau.'],
            ['name' => 'Radiologie', 'duration' => 45, 'price' => 300, 'description' => 'Examens d\'imagerie médicale.'],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}
