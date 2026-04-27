<?php

namespace App\Http\Controllers;

use App\Models\Specialization;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminSpecializationController extends Controller
{
    public function index(): View
    {
        $specializations = Specialization::query()
            ->withCount([
                'doctorUsers as doctors_count' => function ($q) {
                    $q->where('role', 'doctor')->where('status', 'approved');
                },
            ])
            ->orderBy('name')
            ->get();

        return view('admin.specializations', compact('specializations'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specializations,name',
            'description' => 'nullable|string|max:5000',
            'recruitment_date' => 'nullable|date',
        ]);

        Specialization::create($validated);

        return redirect()->route('admin.specializations.index')->with('success', __('Specialization created.'));
    }

    public function update(Request $request, Specialization $specialization): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specializations,name,'.$specialization->id,
            'description' => 'nullable|string|max:5000',
            'recruitment_date' => 'nullable|date',
        ]);

        $specialization->update($validated);

        return redirect()->route('admin.specializations.index')->with('success', __('Specialization updated.'));
    }

    public function destroy(Specialization $specialization): RedirectResponse
    {
        $specialization->delete();

        return redirect()->route('admin.specializations.index')->with('success', __('Specialization deleted.'));
    }
}
