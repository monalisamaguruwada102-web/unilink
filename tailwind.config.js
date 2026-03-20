/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
       colors: {
          'primary-500': '#7c3aed',
          'primary-600': '#6d28d9',
          'accent-pink': '#f472b6',
          'deep-bg': '#05051e',
       }
    },
  },
  plugins: [],
}
