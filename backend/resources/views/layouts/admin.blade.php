<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'Medical Cabinet')</title>
  <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
  @stack('styles')
</head>
<body>
  @yield('body')
  {{-- Pas de app.js / SPA : évite les conflits sur les formulaires admin (specializations, users, …) --}}
</body>
</html>
