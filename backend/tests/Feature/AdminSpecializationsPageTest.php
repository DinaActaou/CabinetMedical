<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can view manage specializations page', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'status' => 'approved',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.specializations.index'))
        ->assertOk()
        ->assertSee(__('Doctor specializations'), false);
});

test('non-admin is redirected from manage specializations', function () {
    $patient = User::factory()->demoPatient()->create();

    $this->actingAs($patient)
        ->get(route('admin.specializations.index'))
        ->assertRedirect('/');

    $this->actingAs($patient)
        ->getJson(route('admin.specializations.index'))
        ->assertForbidden();
});
