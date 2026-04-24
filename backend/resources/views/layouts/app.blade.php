<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'Medical Cabinet')</title>
  <link rel="stylesheet" href="{{ asset('css/styles.css') }}">
  <script src="https://unpkg.com/lucide@latest"></script>
  @stack('styles')
</head>
<body>
    @yield('body')

    <div class="toast-container" id="toast-container"></div>
    <script>
        window.translations = {
            'en': {!! file_exists(base_path('lang/en.json')) ? file_get_contents(base_path('lang/en.json')) : '{}' !!},
            'fr': {!! file_exists(base_path('lang/fr.json')) ? file_get_contents(base_path('lang/fr.json')) : '{}' !!}
        };
    </script>
    <script src="{{ asset('js/app.js') }}"></script>
    @stack('scripts')
</body>
</html>
