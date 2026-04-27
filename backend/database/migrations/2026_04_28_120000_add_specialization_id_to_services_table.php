<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Link each bookable service to a medical specialization so patients only see matching doctors.
     */
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->foreignId('specialization_id')->nullable()->after('price')->constrained()->nullOnDelete();
        });

        if (! Schema::hasTable('specializations')) {
            return;
        }

        $now = now();
        foreach ([
            ['name' => 'Dentistry', 'description' => 'Dental and oral health'],
            ['name' => 'Radiology', 'description' => 'Medical imaging'],
        ] as $spec) {
            DB::table('specializations')->updateOrInsert(
                ['name' => $spec['name']],
                array_merge($spec, ['recruitment_date' => null, 'created_at' => $now, 'updated_at' => $now])
            );
        }

        $pairs = [
            'Consultation Générale' => 'General Medicine',
            'Cardiologie' => 'Cardiology',
            'Pédiatrie' => 'Pediatrics',
            'Dentisterie' => 'Dentistry',
            'Dermatologie' => 'Dermatology',
            'Radiologie' => 'Radiology',
        ];

        foreach ($pairs as $serviceName => $specName) {
            $specId = DB::table('specializations')->where('name', $specName)->value('id');
            if ($specId) {
                DB::table('services')->where('name', $serviceName)->update(['specialization_id' => $specId]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropConstrainedForeignId('specialization_id');
        });
    }
};
