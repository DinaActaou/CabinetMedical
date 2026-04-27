<?php

namespace Database\Seeders;

use App\Models\Specialization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Ensures every specialization has at least one approved doctor (patient booking never empty).
 * Safe to run multiple times (updateOrCreate by email).
 */
class EnsureDoctorsForSpecializationsSeeder extends Seeder
{
    /**
     * Human-readable names for fill-in doctors (one per English specialization label).
     */
    private static function doctorDisplayName(string $specName): string
    {
        return match ($specName) {
            'Cardiology' => 'Dr. Redouane Amrani',
            'Pediatrics' => 'Dr. Hanane Filali',
            'Dermatology' => 'Dr. Imane Chkir',
            'Gynecology' => 'Dr. Amal Berrada',
            'Neurology' => 'Dr. Anas Zemmouri',
            'Ophthalmology' => 'Dr. Youssef Kettani',
            'General Medicine' => 'Dr. Rachid Ouazzani',
            'Dentistry' => 'Dr. Samir Tazi',
            'Radiology' => 'Dr. Nour El Idrissi',
            default => 'Dr. '.Str::title(Str::slug($specName, ' ')).' Alami',
        };
    }

    public function run(): void
    {
        foreach (Specialization::orderBy('id')->get() as $spec) {
            $hasDoctor = User::query()
                ->where('role', 'doctor')
                ->where('status', 'approved')
                ->where('specialization_id', $spec->id)
                ->exists();
            if ($hasDoctor) {
                continue;
            }
            $slug = Str::slug($spec->name) ?: 'spec';
            $displayName = self::doctorDisplayName($spec->name);
            User::updateOrCreate(
                ['email' => "fill-doctor-{$spec->id}-{$slug}@medibook.test"],
                [
                    'name' => $displayName,
                    'password' => Hash::make('password'),
                    'role' => 'doctor',
                    'status' => 'approved',
                    'specialty' => $spec->name,
                    'specialization_id' => $spec->id,
                    'email_verified_at' => now(),
                ]
            );
        }

        // Fix names for existing fill-doctor accounts (e.g. after upgrading from "(demo)" labels)
        foreach (Specialization::orderBy('id')->get() as $spec) {
            $slug = Str::slug($spec->name) ?: 'spec';
            $email = "fill-doctor-{$spec->id}-{$slug}@medibook.test";
            $user = User::query()->where('email', $email)->first();
            if (! $user) {
                continue;
            }
            $expected = self::doctorDisplayName($spec->name);
            if ($user->name !== $expected) {
                $user->update(['name' => $expected, 'specialty' => $spec->name]);
            }
        }
    }
}
