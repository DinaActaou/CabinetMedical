@extends('layouts.admin')

@section('title', __('Doctor specializations'))

@section('body')
<div style="padding: 2rem; max-width: 900px; margin: 0 auto;">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem;">
    <div>
      <h1 style="font-size:1.75rem; color:var(--primary); margin-bottom:0.35rem;">{{ __('Doctor specializations') }}</h1>
      <p style="color:var(--text-muted); max-width:640px;">{{ __('Manage specialization categories (name, description, recruitment date).') }}</p>
    </div>
    <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
      <a href="{{ route('admin.users.index') }}" class="btn btn-outline">{{ __('User Management') }}</a>
      <a href="/" class="btn btn-outline">{{ __('Back to dashboard') }}</a>
      <form method="POST" action="{{ route('web.logout') }}">
        @csrf
        <button class="btn btn-outline" type="submit">{{ __('Logout') }}</button>
      </form>
    </div>
  </div>

  @if(session('success'))
    <div style="margin-bottom:1rem; background:#ECFDF3; color:#065F46; border:1px solid #A7F3D0; padding:0.75rem 1rem; border-radius:10px;">
      {{ session('success') }}
    </div>
  @endif

  @if($errors->any())
    <div style="margin-bottom:1rem; background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; padding:0.75rem 1rem; border-radius:10px;">
      {{ $errors->first() }}
    </div>
  @endif

  <div class="grid-card" style="padding:1.5rem; margin-bottom:2rem;">
    <h2 style="font-size:1.1rem; color:var(--primary); margin-bottom:1rem;">{{ __('Add specialization') }}</h2>
    <form method="POST" action="{{ route('admin.specializations.store') }}" style="display:grid; gap:0.75rem;">
      @csrf
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem;">
        <div>
          <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">{{ __('Name') }}</label>
          <input class="form-control" type="text" name="name" value="{{ old('name') }}" required maxlength="255">
        </div>
        <div>
          <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">{{ __('Recruitment date') }}</label>
          <input class="form-control" type="date" name="recruitment_date" value="{{ old('recruitment_date') }}">
        </div>
      </div>
      <div>
        <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">{{ __('Description') }}</label>
        <textarea class="form-control" name="description" rows="2" maxlength="5000">{{ old('description') }}</textarea>
      </div>
      <div>
        <button class="btn btn-primary" type="submit">{{ __('Save') }}</button>
      </div>
    </form>
  </div>

  @forelse($specializations as $spec)
    <div class="grid-card" style="padding:1.25rem; margin-bottom:1rem;">
      <form method="POST" action="{{ route('admin.specializations.update', $spec) }}" style="display:grid; gap:0.75rem;">
        @csrf
        @method('PUT')
        <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
          <span style="font-size:0.85rem; color:var(--text-muted);">{{ __('Doctors') }}: <strong>{{ $spec->doctors_count }}</strong></span>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-primary" type="submit">{{ __('Save') }}</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:0.75rem;">
          <div>
            <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">{{ __('Name') }}</label>
            <input class="form-control" type="text" name="name" value="{{ $spec->name }}" required maxlength="255">
          </div>
          <div>
            <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">{{ __('Recruitment date') }}</label>
            <input class="form-control" type="date" name="recruitment_date" value="{{ optional($spec->recruitment_date)->format('Y-m-d') }}">
          </div>
        </div>
        <div>
          <label style="display:block; font-size:0.8rem; color:var(--text-muted); margin-bottom:0.25rem;">{{ __('Description') }}</label>
          <textarea class="form-control" name="description" rows="2" maxlength="5000">{{ $spec->description }}</textarea>
        </div>
      </form>
      <form method="POST" action="{{ route('admin.specializations.destroy', $spec) }}" style="margin-top:0.75rem;" onsubmit="return confirm({{ json_encode(__('Confirm delete')) }});">
        @csrf
        @method('DELETE')
        <button class="btn btn-outline" type="submit" style="color:var(--danger); border-color:var(--danger);">{{ __('Delete') }}</button>
      </form>
    </div>
  @empty
    <div class="grid-card" style="padding:2rem; text-align:center; color:var(--text-muted);">{{ __('No specializations yet.') }}</div>
  @endforelse
</div>
@endsection
