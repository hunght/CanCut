/** @type {import('tailwindcss').Config} */
// Tailwind v4 uses CSS-first configuration (@theme in CSS)
// This config file is kept only for plugins
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  // Theme configuration is now in CSS using @theme
  // Only plugins are configured here
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
