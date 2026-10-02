/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070908',
        chalk: '#F1F1EC',
        copper: '#C7A34A',
        surface: '#0B100E',
        card: '#0E1512',
        elevated: '#121A17',
        felt: '#0B6B4F',
        feltDeep: '#0B3D2E',
        live: '#0F8F68',
        glow: '#1FA36A',
        goldDark: '#8D722F',
        gold: '#C7A34A',
        goldLight: '#C7A34A',
        warm: '#F1F1EC',
        muted: '#929B95',
        pending: '#626B66',
        border: '#26312C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        gold: '0 4px 14px rgba(0, 0, 0, 0.22)',
        live: '0 0 12px rgba(15, 143, 104, 0.22)',
      },
      backgroundImage: {
        'felt-gradient': 'linear-gradient(135deg, #070908 0%, #0B100E 52%, #070908 100%)',
        'gold-metal': 'linear-gradient(110deg, #8D722F, #C7A34A, #8D722F)',
      },
    },
  },
  plugins: [],
}
