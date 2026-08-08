/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Yakeen brand palette
        navy: {
          50: '#f0f4fa',
          100: '#d9e2f0',
          200: '#b3c5e0',
          300: '#8da9d0',
          400: '#5d7ba8',
          500: '#3a5685',
          600: '#2a4168',
          700: '#1a2744',
          800: '#0a1525',
          900: '#050b14',
        },
        gold: {
          50: '#fdf8ed',
          100: '#faedcf',
          200: '#f5db9f',
          300: '#efc46d',
          400: '#e9ad3c',
          500: '#c9a961',
          600: '#b8964a',
          700: '#947038',
          800: '#6f5429',
          900: '#4a381b',
        },
        sand: {
          50: '#faf7f2',
          100: '#f0ebe0',
          200: '#e0d5c0',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        arabic: ['Noto Naskh Arabic', 'sans-serif'],
      },
      container: {
        center: true,
        padding: { DEFAULT: '1rem', md: '2rem', lg: '4rem' },
        screens: {
          '2xl': '1280px',
        },
      },
      animation: {
        'pulse-gold': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
