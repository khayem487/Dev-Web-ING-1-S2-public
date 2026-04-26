/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette "Maison Connectée" — bleu nuit + ambre
        ink: {
          50: '#f6f8fb',
          100: '#e9eef5',
          200: '#cbd6e3',
          300: '#9fb1c6',
          400: '#677b96',
          500: '#445a76',
          600: '#2f4360',
          700: '#21314a',
          800: '#152033',
          900: '#0d1626',
        },
        accent: {
          50: '#fff8eb',
          100: '#feedc6',
          200: '#fdd989',
          300: '#fcbf4d',
          400: '#fbaa28',
          500: '#f08a0c',
          600: '#cf6907',
          700: '#a44b09',
          800: '#85390f',
          900: '#702f10',
        },
        success: {
          500: '#16a34a',
          600: '#15803d',
        },
        warn: {
          500: '#eab308',
          600: '#a16207',
        },
        danger: {
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13, 22, 38, 0.06), 0 8px 24px -12px rgba(13, 22, 38, 0.18)',
        ring: '0 0 0 4px rgba(251, 170, 40, 0.25)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 240ms ease-out',
      },
    },
  },
  plugins: [],
}
