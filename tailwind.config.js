/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: '#0A0A0A',
        card: '#121212',
        surface: '#0A0A0A',
        elevated: '#141414',
        ink: '#0A0A0A',
        chalk: '#F5F5F5',
        warm: '#F5F5F5',
        muted: '#A3A3A3',
        pending: '#A3A3A3',
        border: 'rgba(255, 255, 255, 0.10)',
        green: '#1E8F63',
        live: '#1E8F63',
        glow: '#1E8F63',
        gold: '#C9A24B',
        goldLight: '#C9A24B',
        goldDark: '#C9A24B',
        felt: '#1E8F63',
        feltDeep: '#0A0A0A',
        copper: '#C9A24B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        gold: 'none',
        live: 'none',
      },
      backgroundImage: {
        'felt-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #121212 100%)',
        'gold-metal': 'linear-gradient(180deg, #C9A24B 0%, #C9A24B 100%)',
      },
    },
  },
  plugins: [],
}
