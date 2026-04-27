@extends('layouts.admin')

@section('title', __('Admin - User Management'))

@section('body')
<div style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
    <div>
      <h1 style="font-size:1.75rem; color:var(--primary); margin-bottom:0.35rem;">{{ __('User Management') }}</h1>
      <p style="color:var(--text-muted);">{{ __('Approve patients as doctors and manage user access.') }}</p>
    </div>
    <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
      <a href="{{ route('admin.specializations.index') }}" class="btn btn-outline">{{ __('Doctor specializations') }}</a>
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

  <div class="grid-card" style="padding: 0; overflow:hidden;">
    <table style="width:100%;">
      <thead>
        <tr>
          <th>{{ __('Name') }}</th>
          <th>{{ __('Email') }}</th>
          <th>{{ __('Role') }}</th>
          <th>{{ __('Status') }}</th>
          <th>{{ __('Created At') }}</th>
          <th class="text-right">{{ __('Actions') }}</th>
        </tr>
      </thead>
      <tbody>
        @forelse($users as $user)
          <tr>
            <td>{{ $user->name }}</td>
            <td>{{ $user->email }}</td>
            <td>{{ ucfirst($user->role) }}</td>
            <td>{{ ucfirst($user->status) }}</td>
            <td>{{ optional($user->created_at)->format('Y-m-d') }}</td>
            <td class="text-right">
              @if($user->role !== 'admin')
                @if($user->role === 'patient')
                  <form method="POST" action="{{ route('web.users.role', $user) }}" style="display:inline;">
                    @csrf
                    @method('PUT')
                    <input type="hidden" name="role" value="doctor">
                    <button class="btn btn-primary" type="submit">{{ __('Approve as Doctor') }}</button>
                  </form>
                @elseif($user->role === 'doctor')
                  <form method="POST" action="{{ route('web.users.role', $user) }}" style="display:inline;">
                    @csrf
                    @method('PUT')
                    <input type="hidden" name="role" value="patient">
                    <button class="btn btn-outline" type="submit">{{ __('Revoke Doctor') }}</button>
                  </form>
                @endif
              @endif
            </td>
          </tr>
        @empty
          <tr>
            <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">{{ __('No users found.') }}</td>
          </tr>
        @endforelse
      </tbody>
    </table>
  </div>
</div>
@endsection

