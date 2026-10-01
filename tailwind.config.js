/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#050505',
        chalk: '#F5F1E6',
        copper: '#D4AF37',
        surface: '#0B0B0B',
        card: '#111612',
        felt: '#0F5A3F',
        feltDeep: '#0B3D2E',
        live: '#1FA36A',
        glow: '#34D399',
        goldDark: '#B8902E',
        gold: '#D4AF37',
        goldLight: '#F2D675',
        warm: '#F5F1E6',
        muted: '#A8A28F',
        pending: '#66766C',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 0 28px rgba(212, 175, 55, 0.2)',
        live: '0 0 30px rgba(31, 163, 106, 0.3)',
      },
      backgroundImage: {
        'felt-gradient': 'linear-gradient(135deg, #050505 0%, #0B3D2E 48%, #050505 100%)',
        'gold-metal': 'linear-gradient(110deg, #B8902E 0%, #F2D675 48%, #B8902E 100%)',
      },
    },
  },
  plugins: [],
}
