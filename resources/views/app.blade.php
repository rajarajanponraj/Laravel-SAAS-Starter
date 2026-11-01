<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="ltr" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
                
                // Set initial direction from user locale if available
                // Set initial direction from user locale if available
                const userLocale = '{{ app()->getLocale() }}';
                const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
                const isRTL = rtlLanguages.includes(userLocale);
                const direction = isRTL ? 'rtl' : 'ltr';
                document.documentElement.setAttribute('dir', direction);
                document.documentElement.setAttribute('lang', userLocale);
                if (document.body) {
                    document.body.setAttribute('dir', direction);
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(0.98 0.01 88);
            }

            html.dark {
                background-color: oklch(0.13 0.01 240);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=crewbunker">
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico?v=crewbunker" sizes="any">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=crewbunker">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&instrument-sans:400,500,600" rel="stylesheet" />

        <!-- Matomo -->
        <script>
          var _paq = window._paq = window._paq || [];
          /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
          _paq.push(["setCookieDomain", "*.bytebunkers.in"]);
          _paq.push(["setDoNotTrack", true]);
          _paq.push(['trackPageView']);
          _paq.push(['enableLinkTracking']);
          (function() {
            var u="//tracking.bytebunkers.sbs/";
            _paq.push(['setTrackerUrl', u+'matomo.php']);
            _paq.push(['setSiteId', '1']);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
          })();
        </script>
        <!-- End Matomo Code -->

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        <noscript><p><img referrerpolicy="no-referrer-when-downgrade" src="//tracking.bytebunkers.sbs/matomo.php?idsite=1&amp;rec=1" style="border:0;" alt="" /></p></noscript>
        @inertia
    </body>
</html>
