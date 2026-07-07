/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zenith: {
          yellow: "#FFB703",
          dark: "#1A1A1A",
          light: "#FAFAFA",
        }
      },
    },
  },
  plugins: [],
}
