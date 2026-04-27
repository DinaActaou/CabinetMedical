<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Specialization;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            ['name' => 'Consultation Générale', 'duration' => 30, 'price' => 150, 'description' => 'Consultation médicale générale.', 'specialization' => 'General Medicine'],
            ['name' => 'Cardiologie', 'duration' => 45, 'price' => 350, 'description' => 'Examen cardiologique complet.', 'specialization' => 'Cardiology'],
            ['name' => 'Pédiatrie', 'duration' => 30, 'price' => 200, 'description' => 'Soins spécialisés pour enfants.', 'specialization' => 'Pediatrics'],
            ['name' => 'Dentisterie', 'duration' => 60, 'price' => 400, 'description' => 'Soins dentaires et bucco-dentaires.', 'specialization' => 'Dentistry'],
            ['name' => 'Dermatologie', 'duration' => 30, 'price' => 250, 'description' => 'Traitement des maladies de la peau.', 'specialization' => 'Dermatology'],
            ['name' => 'Radiologie', 'duration' => 45, 'price' => 300, 'description' => 'Examens d\'imagerie médicale.', 'specialization' => 'Radiology'],
        ];

        foreach ($services as $row) {
            $specName = $row['specialization'];
            unset($row['specialization']);
            $row['specialization_id'] = Specialization::where('name', $specName)->value('id');

            Service::updateOrCreate(
                ['name' => $row['name']],
                $row
            );
        }
    }
}
