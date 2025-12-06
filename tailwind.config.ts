import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 4-Color Functional Scheme
        // 1. Primary - Main brand color for primary actions, highlights, active states
        primary: {
          50: '#F1F8E9',   // Lightest tint
          100: '#E8F5E9',  // Light background
          200: '#C5E1A5',  // Light accent
          300: '#9CCC65',  // Medium light
          400: '#BCC225',  // DEFAULT - Main brand color
          500: '#7CB342',  // Medium
          600: '#558B2F',  // Medium dark
          700: '#4A7C2A',  // Dark
        },
        // 2. Neutral - Gray scale for text, backgrounds, borders, secondary elements
        neutral: {
          50: '#F7FAFC',   // Lightest background
          100: '#F1F5F9',  // Light background
          200: '#E2E8F0',  // Border/divider
          300: '#CBD5E0',  // Disabled/placeholder
          400: '#A0AEC0',  // Secondary text
          500: '#718096',  // Default text
          600: '#4A5568',  // Dark text
          700: '#2D3748',  // Darker text
          800: '#1A202C',  // Very dark text
          900: '#0A0A0A',  // Black
          950: '#000000',  // Pure black
        },
        // 3. Success - Green for positive states, completions, success messages
        success: {
          50: '#F0FDF4',   // Lightest
          100: '#E8F5E9',  // Light background
          200: '#C5E1A5',  // Light accent
          300: '#9CCC65',  // Medium light
          400: '#7CB342',  // DEFAULT - Success color
          500: '#558B2F',  // Medium
          600: '#4A7C2A',  // Dark
        },
        // 4. Alert - Amber for warnings, important actions, notifications
        alert: {
          50: '#FFFEF0',   // Lightest
          100: '#FEF3C7',  // Light background
          200: '#FDE68A',  // Light accent
          300: '#FCD34D',  // Medium light
          400: '#FFB412',  // DEFAULT - Alert color
          500: '#D69E2E',  // Medium
          600: '#B45309',  // Dark
        },
        // Legacy support - map to new scheme
        black: '#000000',
        white: '#FFFFFF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],      // leading-4
        sm: ['14px', { lineHeight: '20px' }],      // leading-5
        base: ['16px', { lineHeight: '24px' }],    // leading-6
        '2xl': ['24px', { lineHeight: '36px' }],   // leading-9
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        extrabold: '800',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
      },
      screens: {
        'xs': '375px',
        'sm': '440px', // Your design width
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
};
export default config;

