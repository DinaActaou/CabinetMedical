<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'specialization_id')) {
                $table->foreignId('specialization_id')->nullable()->after('gender')->constrained()->nullOnDelete();
            }
        });

        if (Schema::hasTable('specializations') && Schema::hasColumn('users', 'specialty')) {
            $specs = DB::table('specializations')->pluck('id', 'name');
            foreach ($specs as $name => $id) {
                DB::table('users')
                    ->where('role', 'doctor')
                    ->where('specialty', $name)
                    ->update(['specialization_id' => $id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'specialization_id')) {
                $table->dropConstrainedForeignId('specialization_id');
            }
        });
    }
};
