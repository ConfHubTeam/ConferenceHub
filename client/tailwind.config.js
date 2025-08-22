/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (updated to new design system)
        primary: "#1D2A50",
        secondary: "#2E3D69", 
        normal: "#717171ff",
        
        // Brand colors (updated naming)
        "brand-primary": "#1D2A50",
        "brand-secondary": "#2E3D69",
        
        // Navy color palette
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        
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
        
        // New Design System Colors (from UI Requirements)
        'bg-primary': '#F8F9FA',      // Main background
        'bg-card': '#FFFFFF',         // Cards/blocks background  
        'bg-secondary': '#FAFAFA',    // Alternative background
        
        'text-primary': '#0E1220',    // Primary text (logo color)
        'text-secondary': '#5F6373',  // Secondary text
        'text-muted': '#9FA4B1',      // Disabled/inactive text
        
        'border-light': '#E2E4E9',    // Lines/borders
        'border-default': '#D6D8DD',  // Default borders
        
        'accent-primary': '#1D2A50',  // Main accent color
        'accent-hover': '#2E3D69',    // Hover effects
        'accent-highlight': '#4F6EF7', // Buttons, links, active elements
        
        // Status colors (semantic - same as existing but explicit)
        'status-success': '#2ECC71',  // Confirmation, success messages
        'status-info': '#3498DB',     // Info blocks
        'status-warning': '#F39C12',  // Attention / warning
        'status-error': '#E74C3C',    // Errors, critical messages
        
        // Chart colors (SOLID/DRY improvement)
        'chart-rating-1': '#dc2626',  // error-600 for 1 star
        'chart-rating-2': '#ea580c',  // orange-600 for 2 stars  
        'chart-rating-3': '#ca8a04',  // yellow-600 for 3 stars
        'chart-rating-4': '#16a34a',  // success-600 for 4 stars
        'chart-rating-5': '#059669',  // emerald-600 for 5 stars
        
        'chart-status-pending': '#d97706',   // warning-600
        'chart-status-approved': '#059669',  // emerald-600
        'chart-status-rejected': '#dc2626',  // error-600
        
        'chart-info-bg': 'rgba(59, 130, 246, 0.1)',
        'chart-info-border': 'rgb(59, 130, 246)',
        'chart-primary-bg': 'rgba(29, 42, 80, 0.1)',
        'chart-primary-border': 'rgb(29, 42, 80)',
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
        },
        
        // Logo color utilities
        '.logo-navy': {
          'filter': 'brightness(0) saturate(100%) invert(15%) sepia(25%) saturate(1200%) hue-rotate(210deg) brightness(94%) contrast(96%)'
        },
        '.logo-white': {
          'filter': 'brightness(0) invert(1) drop-shadow(0 0 12px rgba(255,255,255,0.8))'
        },
        
        // Design System Shadow (from UI requirements)
        '.shadow-ui': {
          'box-shadow': '0px 4px 12px rgba(14, 18, 32, 0.08)'
        },
        
        // Button states
        '.btn-disabled': {
          'background-color': '#D6D8DD',
          'color': '#9FA4B1',
          'cursor': 'not-allowed'
        },
        
        // Icon states
        '.icon-active': {
          'color': '#1D2A50'
        },
        '.icon-inactive': {
          'color': '#9FA4B1'
        },
        
        // Form controls (SOLID/DRY improvement)
        '.form-input': {
          '@apply w-full p-2 sm:p-2.5 text-sm border border-border-default rounded-lg bg-bg-card focus:ring-2 focus:ring-accent-primary focus:border-accent-primary transition-colors': {}
        },
        '.form-select': {
          '@apply form-input appearance-none pr-8 cursor-pointer': {}
        },
        '.form-label': {
          '@apply block text-sm font-medium text-text-primary mb-1.5': {}
        },
        
        // Button patterns (SOLID/DRY improvement)
        '.btn-base': {
          '@apply inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed': {}
        },
        '.btn-primary': {
          '@apply btn-base bg-accent-primary text-white hover:bg-accent-hover focus:ring-accent-primary shadow-sm hover:shadow-md': {}
        },
        '.btn-secondary': {
          '@apply btn-base bg-accent-highlight text-white hover:bg-blue-600 focus:ring-accent-highlight shadow-sm hover:shadow-md': {}
        },
        '.btn-outline': {
          '@apply btn-base bg-transparent border border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white hover:shadow-md focus:ring-accent-primary': {}
        },
        '.btn-ghost': {
          '@apply btn-base bg-transparent text-text-primary hover:bg-bg-secondary focus:ring-accent-primary': {}
        },
        '.btn-size-sm': {
          '@apply px-3 py-1.5 text-xs': {}
        },
        '.btn-size-md': {
          '@apply px-4 py-2 text-sm': {}
        },
        '.btn-size-lg': {
          '@apply px-6 py-3 text-base': {}
        },
        
        // Modal patterns (SOLID/DRY improvement)
        '.modal-overlay': {
          '@apply fixed inset-0 z-[99999] bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4': {}
        },
        '.modal-container': {
          '@apply bg-bg-card rounded-xl shadow-2xl w-full max-h-[95vh] flex flex-col overflow-hidden': {}
        },
        '.modal-header': {
          '@apply flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border-light flex-shrink-0 bg-bg-secondary': {}
        },
        '.modal-body': {
          '@apply flex-1 overflow-y-auto p-4 sm:p-6': {}
        },
        '.modal-footer': {
          '@apply flex items-center justify-end gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-border-light bg-bg-secondary': {}
        },
        
        // Filter patterns (SOLID/DRY improvement)
        '.filter-button': {
          '@apply px-3 sm:px-4 py-1.5 sm:py-2 border border-border-default rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm': {}
        },
        '.filter-button-active': {
          '@apply filter-button bg-accent-primary text-white border-accent-primary': {}
        },
        '.filter-button-inactive': {
          '@apply filter-button bg-bg-card text-text-primary hover:bg-bg-secondary hover:border-accent-primary': {}
        },
        '.filter-container': {
          '@apply flex flex-wrap gap-2 sm:gap-3': {}
        },
        '.filter-pill': {
          '@apply flex items-center px-3 py-2 border rounded-full text-xs flex-shrink-0 whitespace-nowrap transition-all duration-200': {}
        },
        '.filter-pill-active': {
          '@apply filter-pill bg-accent-primary text-white border-accent-primary': {}
        },
        '.filter-pill-inactive': {
          '@apply filter-pill bg-bg-card hover:bg-bg-secondary text-text-primary border-border-default hover:border-border-default': {}
        },
        
        // Card patterns (SOLID/DRY improvement)
        '.card-base': {
          '@apply bg-bg-card border border-border-light rounded-lg shadow-ui': {}
        },
        '.card-content': {
          '@apply spacing-card': {}
        },
        '.card-header': {
          '@apply border-b border-border-light pb-3 mb-3': {}
        },
        '.card-footer': {
          '@apply border-t border-border-light pt-3 mt-3': {}
        },
        
        // Status patterns (SOLID/DRY improvement)
        '.status-success': {
          '@apply bg-status-success text-white': {}
        },
        '.status-error': {
          '@apply bg-status-error text-white': {}
        },
        '.status-warning': {
          '@apply bg-status-warning text-white': {}
        },
        '.status-info': {
          '@apply bg-status-info text-white': {}
        },
        '.status-badge': {
          '@apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium': {}
        },
        
        // Chart patterns (SOLID/DRY improvement)
        '.chart-container': {
          '@apply bg-bg-card border border-border-light rounded-lg p-4 shadow-ui': {}
        },
        '.chart-title': {
          '@apply text-lg font-semibold text-text-primary mb-4': {}
        },
        '.chart-legend': {
          '@apply flex items-center gap-2 text-sm text-text-secondary': {}
        },
        
        // Loading patterns (SOLID/DRY improvement)
        '.loading-spinner': {
          '@apply animate-spin rounded-full border-2 border-border-light border-t-accent-primary': {}
        },
        '.loading-skeleton': {
          '@apply animate-pulse bg-border-light rounded': {}
        },
        
        // Typography patterns (SOLID/DRY improvement)
        '.text-heading-1': {
          '@apply text-2xl sm:text-3xl font-bold text-text-primary': {}
        },
        '.text-heading-2': {
          '@apply text-xl sm:text-2xl font-semibold text-text-primary': {}
        },
        '.text-heading-3': {
          '@apply text-lg sm:text-xl font-medium text-text-primary': {}
        },
        '.text-body': {
          '@apply text-sm sm:text-base text-text-primary': {}
        },
        '.text-caption': {
          '@apply text-xs sm:text-sm text-text-secondary': {}
        },
        '.text-muted': {
          '@apply text-text-muted': {}
        },
        
        // Hover animations (SOLID/DRY improvement)
        '.hover-pop': {
          '@apply transition-transform duration-200 hover:scale-110': {}
        },
        '.hover-pop-sm': {
          '@apply transition-transform duration-200 hover:scale-105': {}
        },
        '.hover-pop-lg': {
          '@apply transition-transform duration-300 hover:scale-125': {}
        },
        '.hover-bounce': {
          '@apply transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg': {}
        }
      })
    }
  ],
}

