<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialization extends Model
{
    protected $fillable = [
        'name',
        'description',
        'recruitment_date',
    ];

    protected function casts(): array
    {
        return [
            'recruitment_date' => 'date',
        ];
    }

    public function doctors(): HasMany
    {
        return $this->hasMany(User::class, 'specialization_id')
            ->where('role', 'doctor')
            ->where('status', 'approved')
            ->orderBy('name');
    }

    public function doctorUsers(): HasMany
    {
        return $this->hasMany(User::class, 'specialization_id');
    }
}
