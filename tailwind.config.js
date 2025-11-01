/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // indigo-600
        muted: '#6b7280',
      },
      container: {
        center: true,
        padding: '1rem',
      }
    },
  },
  plugins: [],
}
