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
            if (! Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['pending', 'approved'])->default('pending')->after('role');
            }
        });

        DB::statement("UPDATE users SET role = 'patient' WHERE role IS NULL");
        DB::statement("UPDATE users SET status = 'approved' WHERE role IN ('doctor','admin')");
        DB::statement("UPDATE users SET status = 'pending' WHERE role = 'patient' AND status IS NULL");
        DB::statement("UPDATE users SET status = 'pending' WHERE status IS NULL");
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
