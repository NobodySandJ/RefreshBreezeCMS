/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-green': '#079108',
        'custom-green-light': '#10b114',
        'custom-green-dark': '#065906',
        'custom-mint': '#c3e3a3',
        'custom-sage': '#b8dfd8',
        'custom-cream': '#fdfdf8',
        'custom-ivory': '#faf9f5',
        'bg-dark': '#0a0f1d',
        'dark': '#0a0f1d',
        'bg-card': '#111827',
        'accent-yellow': '#fbbf24',
        'accent-blue': '#38bdf8',
        'accent-emerald': '#10b981',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'marker': ['Permanent Marker', 'cursive'],
      },
      backgroundImage: {
        'gradient-green': 'linear-gradient(135deg, #079108 0%, #10b114 100%)',
        'gradient-green-light': 'linear-gradient(135deg, #c3e3a3 0%, #b8dfd8 100%)',
        'gradient-green-radial': 'radial-gradient(circle, #079108 0%, #065906 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0f1d 0%, #0f172a 100%)',
      },
      animation: {
        'pulse-custom': 'pulse-custom 2s infinite cubic-bezier(0.4, 0, 0.6, 1)',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'bounce-slow': 'bounce 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-custom': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(7, 145, 8, 0.6)' },
          '50%': { boxShadow: '0 0 0 10px rgba(7, 145, 8, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        glow: {
          'from': { 'box-shadow': '0 0 5px #38bdf8, 0 0 10px #38bdf8' },
          'to': { 'box-shadow': '0 0 15px #38bdf8, 0 0 25px #0ea5e9' },
        }
      },
    },
  },
  plugins: [],
}
