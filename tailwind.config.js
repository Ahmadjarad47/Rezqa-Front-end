/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        'text': '#000000',
        'bg': '#f6f6f6',
        'accent': '#56ff50',
        'text-light': '#333333',
        'bg-light': '#ffffff',
        'accent-dark': '#4ae04a',
        'accent-light': '#7aff7a',
        // Override default colors
        'primary': '#56ff50',
        'secondary': '#000000',
        'success': '#56ff50',
        'info': '#56ff50',
        'warning': '#56ff50',
        'danger': '#ff0000',
        'light': '#f6f6f6',
        'dark': '#000000',
        // Gray scale overrides
        'gray': {
          50: '#f6f6f6',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#d0d0d0',
          400: '#a0a0a0',
          500: '#808080',
          600: '#606060',
          700: '#404040',
          800: '#202020',
          900: '#000000',
        },
        // Green scale overrides to match accent
        'green': {
          50: '#f0fff0',
          100: '#e0ffe0',
          200: '#c0ffc0',
          300: '#a0ffa0',
          400: '#80ff80',
          500: '#56ff50',
          600: '#4ae04a',
          700: '#3ec03e',
          800: '#32a032',
          900: '#268026',
        }
      },
      backgroundColor: {
        'primary': '#56ff50',
        'secondary': '#000000',
        'accent': '#56ff50',
        'main': '#f6f6f6',
        'card': '#ffffff',
      },
      textColor: {
        'primary': '#000000',
        'secondary': '#56ff50',
        'accent': '#56ff50',
        'main': '#000000',
      },
      borderColor: {
        'primary': '#56ff50',
        'secondary': '#000000',
        'accent': '#56ff50',
        'main': '#f6f6f6',
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}



