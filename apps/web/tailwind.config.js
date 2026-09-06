/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Botanical / Organic Serif Palette
        alabaster: {
          DEFAULT: '#F9F8F4',
          50: '#FFFFFF',
          100: '#F9F8F4',
          200: '#F2F0EB',
          300: '#E6E2DA',
        },
        forest: {
          DEFAULT: '#2D3A31',
          50: '#F2F5F3',
          100: '#E1E8E3',
          200: '#C2D1C6',
          300: '#9DB3A3',
          400: '#738F7B',
          500: '#4F6C57',
          600: '#3D5544',
          700: '#2D3A31',
          800: '#1E2822',
          900: '#131A16',
          950: '#0B0F0C'
        },
        sage: {
          DEFAULT: '#8C9A84',
          50: '#F5F7F4',
          100: '#E8ECE6',
          200: '#D2DAD0',
          300: '#B6C3B2',
          400: '#8C9A84',
          500: '#73826B',
          600: '#5B6854',
          700: '#454F3F',
          800: '#30372C',
        },
        clay: {
          DEFAULT: '#DCCFC2',
          50: '#FAF8F5',
          100: '#F2F0EB',
          200: '#E6E0D7',
          300: '#DCCFC2',
          400: '#C9B7A6',
          500: '#B29D8A',
          600: '#94806E',
        },
        stone: {
          DEFAULT: '#E6E2DA',
          50: '#FAF9F7',
          100: '#F2EFEB',
          200: '#E6E2DA',
          300: '#D4CEBF',
          400: '#B8B09F',
        },
        terracotta: {
          DEFAULT: '#C27B66',
          50: '#FBF5F3',
          100: '#F5E8E4',
          200: '#EBCDC4',
          300: '#DEACA0',
          400: '#D08C7B',
          500: '#C27B66',
          600: '#A95E4A',
          700: '#8C4634',
          800: '#6E3223',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
        'arch': '200px',
      },
      boxShadow: {
        'organic': '0 10px 30px -10px rgba(45, 58, 49, 0.06)',
        'organic-lg': '0 20px 40px -10px rgba(45, 58, 49, 0.08)',
        'organic-hover': '0 25px 50px -12px rgba(45, 58, 49, 0.12)',
      },
      transitionTimingFunction: {
        'organic': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
