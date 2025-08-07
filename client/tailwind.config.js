/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors
        primary: "#f38129",
        secondary: "#3b2881",
        normal: "#717171ff",
        
        // Brand colors (consistent naming)
        "brand-orange": "#f38129",
        "brand-purple": "#3b2881",
        
        // Semantic color tokens
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        
        // Neutral grays (consistent system)
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
        },
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
        },
        // Responsive spacing utilities following mobile-first approach
        '.spacing-container': {
          'padding-left': '1rem',
          'padding-right': '1rem',
          '@screen sm': {
            'padding-left': '1.5rem',
            'padding-right': '1.5rem',
          },
          '@screen lg': {
            'padding-left': '2rem',
            'padding-right': '2rem',
          }
        },
        '.spacing-section': {
          'padding-top': '1rem',
          'padding-bottom': '1rem',
          '@screen sm': {
            'padding-top': '1.5rem',
            'padding-bottom': '1.5rem',
          },
          '@screen lg': {
            'padding-top': '2rem',
            'padding-bottom': '2rem',
          }
        },
        '.spacing-card': {
          'padding': '1rem',
          '@screen sm': {
            'padding': '1.5rem',
          },
          '@screen lg': {
            'padding': '2rem',
          }
        },
        '.spacing-content': {
          'padding': '1rem',
          '@screen sm': {
            'padding': '1.5rem',
          },
          '@screen md': {
            'padding': '2rem',
          },
          '@screen lg': {
            'padding': '2.5rem',
          }
        }
      })
    }
  ],
}

