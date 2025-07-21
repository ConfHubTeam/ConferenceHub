/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#f38129", // Changed from red to orange
        normal: "#717171ff",
        // Brand colors from the design
        "brand-orange": "#f38129",
        "brand-purple": "#3b2881",
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0) translateY(0) scale(1)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px) translateY(1px) scale(1.05)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(2px) translateY(2px) scale(1.08)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'shake': 'shake 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s 1',
        'fadeIn': 'fadeIn 0.2s ease-out',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.scroll-smooth': {
          'scroll-behavior': 'smooth'
        }
      })
    }
  ],
}

