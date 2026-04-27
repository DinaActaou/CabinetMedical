<?php

namespace Database\Seeders;

use App\Models\Specialization;
use Illuminate\Database\Seeder;

class SpecializationSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['name' => 'Cardiology', 'description' => 'Heart and cardiovascular system', 'recruitment_date' => '2020-01-15'],
            ['name' => 'Pediatrics', 'description' => 'Medical care of infants and children', 'recruitment_date' => '2020-02-01'],
            ['name' => 'Dermatology', 'description' => 'Skin, hair, and nails', 'recruitment_date' => '2020-03-10'],
            ['name' => 'Gynecology', 'description' => 'Women reproductive health', 'recruitment_date' => '2020-04-05'],
            ['name' => 'Neurology', 'description' => 'Brain and nervous system', 'recruitment_date' => '2020-05-20'],
            ['name' => 'Ophthalmology', 'description' => 'Eye and vision care', 'recruitment_date' => '2020-06-12'],
            ['name' => 'General Medicine', 'description' => 'Primary care and general practice', 'recruitment_date' => '2019-09-01'],
            ['name' => 'Dentistry', 'description' => 'Dental and oral health', 'recruitment_date' => '2020-07-01'],
            ['name' => 'Radiology', 'description' => 'Medical imaging', 'recruitment_date' => '2020-08-01'],
        ];

        foreach ($items as $row) {
            Specialization::firstOrCreate(
                ['name' => $row['name']],
                [
                    'description' => $row['description'] ?? null,
                    'recruitment_date' => $row['recruitment_date'] ?? null,
                ]
            );
        }
    }
}
